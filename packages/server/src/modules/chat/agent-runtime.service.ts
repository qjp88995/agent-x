import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { createAlibaba } from '@ai-sdk/alibaba';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMoonshotAI } from '@ai-sdk/moonshotai';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, stepCountIs, streamText, type Tool } from 'ai';
import { createZhipu } from 'zhipu-ai-provider';

import { decrypt } from '../../common/crypto.util';
import { PrismaService } from '../../prisma/prisma.service';
import { McpClientService } from '../mcp/mcp-client.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { getBuiltInTools } from './tools';

interface AgentWithRelations {
  readonly status: string;
  readonly systemPrompt: string;
  readonly temperature: number;
  readonly maxTokens: number;
  readonly modelId: string;
  readonly provider: {
    readonly protocol: string;
    readonly baseUrl: string;
    readonly apiKey: string;
  };
  readonly skills: ReadonlyArray<{
    readonly skill: { readonly content: string };
  }>;
  readonly mcpServers: ReadonlyArray<{
    readonly enabledTools: string[];
    readonly mcpServer: {
      readonly transport: string;
      readonly config: unknown;
    };
  }>;
}

type McpToolSet = Record<string, Tool>;

@Injectable()
export class AgentRuntimeService {
  private readonly logger = new Logger(AgentRuntimeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mcpClient: McpClientService,
    private readonly workspaceService: WorkspaceService
  ) {}

  async createStream(
    agentId: string,
    messages: Array<{ role: string; content: string }>,
    options?: { abortSignal?: AbortSignal; conversationId?: string }
  ): Promise<any> {
    const start = Date.now();
    this.logger.log(`[createStream] START agentId=${agentId}`);

    const agent: AgentWithRelations = await this.prisma.agent.findFirstOrThrow({
      where: { id: agentId, deletedAt: null },
      include: {
        provider: true,
        skills: {
          include: { skill: true },
          orderBy: { priority: 'desc' },
        },
        mcpServers: { include: { mcpServer: true } },
      },
    });
    this.logger.log(
      `[createStream] agent loaded model=${agent.modelId} protocol=${agent.provider.protocol} skills=${agent.skills.length} mcpServers=${agent.mcpServers.length} +${Date.now() - start}ms`
    );

    if (agent.status === 'ARCHIVED') {
      throw new BadRequestException('Cannot chat with an archived agent');
    }

    const skillContents = agent.skills
      .map(entry => entry.skill.content)
      .join('\n\n---\n\n');
    const systemPrompt = skillContents
      ? `${agent.systemPrompt}\n\n## Skills\n\n${skillContents}`
      : agent.systemPrompt;

    const encryptionSecret = this.config.get<string>('ENCRYPTION_SECRET')!;
    const apiKey = decrypt(agent.provider.apiKey, encryptionSecret);
    const model = this.createModel(
      agent.provider.protocol,
      agent.provider.baseUrl,
      apiKey,
      agent.modelId
    );

    this.logger.log(`[createStream] collecting MCP tools...`);
    const { tools: mcpTools, cleanups } = await this.collectMcpTools(
      agent.mcpServers
    );
    const built = getBuiltInTools(
      this.workspaceService,
      options?.conversationId
    );
    const tools: McpToolSet = { ...built, ...mcpTools };
    const hasTools = Object.keys(tools).length > 0;
    this.logger.log(
      `[createStream] tools ready count=${Object.keys(tools).length} (mcp=${Object.keys(mcpTools).length} builtin=${Object.keys(built).length}) +${Date.now() - start}ms`
    );

    this.logger.log(`[createStream] calling streamText...`);
    const result = streamText({
      model,
      system: systemPrompt,
      messages: messages as any,
      temperature: agent.temperature,
      maxOutputTokens: agent.maxTokens,
      experimental_telemetry: { isEnabled: true },
      ...(hasTools ? { tools, stopWhen: stepCountIs(10) } : {}),
      ...(options?.abortSignal ? { abortSignal: options.abortSignal } : {}),
      onFinish: async () => {
        await this.cleanupMcpSessions(cleanups);
      },
      onError: async event => {
        this.logger.error(`[createStream] streamText error: ${event.error}`);
        await this.cleanupMcpSessions(cleanups);
      },
    });
    this.logger.log(
      `[createStream] streamText started +${Date.now() - start}ms`
    );

    return result;
  }

  async createStreamFromVersion(
    agentVersionId: string,
    messages: Array<{ role: string; content: string }>,
    options?: { abortSignal?: AbortSignal; conversationId?: string }
  ): Promise<any> {
    const version = await this.prisma.agentVersion.findUniqueOrThrow({
      where: { id: agentVersionId },
      include: { provider: true },
    });

    const skills = version.skillsSnapshot as Array<{ content: string }>;
    const skillContents = skills.map(s => s.content).join('\n\n---\n\n');
    const systemPrompt = skillContents
      ? `${version.systemPrompt}\n\n## Skills\n\n${skillContents}`
      : version.systemPrompt;

    const encryptionSecret = this.config.get<string>('ENCRYPTION_SECRET')!;
    const apiKey = decrypt(version.provider.apiKey, encryptionSecret);
    const model = this.createModel(
      version.provider.protocol,
      version.provider.baseUrl,
      apiKey,
      version.modelId
    );

    const mcpSnapshot = version.mcpServersSnapshot as Array<{
      transport: string;
      config: Record<string, unknown>;
      enabledTools: string[];
    }>;
    const { tools: mcpTools, cleanups } = await this.collectMcpTools(
      mcpSnapshot.map(s => ({
        enabledTools: s.enabledTools,
        mcpServer: { transport: s.transport, config: s.config },
      }))
    );

    const built = getBuiltInTools(
      this.workspaceService,
      options?.conversationId
    );
    const tools: McpToolSet = { ...built, ...mcpTools };
    const hasTools = Object.keys(tools).length > 0;

    return streamText({
      model,
      system: systemPrompt,
      messages: messages as any,
      temperature: version.temperature,
      maxOutputTokens: version.maxTokens,
      experimental_telemetry: { isEnabled: true },
      ...(hasTools ? { tools, stopWhen: stepCountIs(10) } : {}),
      ...(options?.abortSignal ? { abortSignal: options.abortSignal } : {}),
      onFinish: async () => {
        await this.cleanupMcpSessions(cleanups);
      },
      onError: async () => {
        await this.cleanupMcpSessions(cleanups);
      },
    });
  }

  private async collectMcpTools(
    mcpServers: AgentWithRelations['mcpServers']
  ): Promise<{ tools: McpToolSet; cleanups: Array<() => Promise<void>> }> {
    if (mcpServers.length === 0) {
      return { tools: {}, cleanups: [] };
    }

    const cleanups: Array<() => Promise<void>> = [];
    let mergedTools: McpToolSet = {};

    const sessions = await Promise.allSettled(
      mcpServers.map(entry =>
        this.mcpClient.createMcpSession(
          entry.mcpServer.transport,
          entry.mcpServer.config as Record<string, unknown>,
          entry.enabledTools
        )
      )
    );

    for (const result of sessions) {
      if (result.status === 'fulfilled') {
        mergedTools = { ...mergedTools, ...result.value.tools };
        cleanups.push(result.value.cleanup);
      } else {
        this.logger.warn(`Failed to create MCP session: ${result.reason}`);
      }
    }

    return { tools: mergedTools, cleanups };
  }

  private async cleanupMcpSessions(
    cleanups: Array<() => Promise<void>>
  ): Promise<void> {
    const results = await Promise.allSettled(
      cleanups.map(cleanup => cleanup())
    );
    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.warn(`Failed to cleanup MCP session: ${result.reason}`);
      }
    }
  }

  async generateTitle(
    agentId: string,
    userMessage: string,
    assistantMessage: string
  ): Promise<string> {
    const agent = await this.prisma.agent.findFirstOrThrow({
      where: { id: agentId, deletedAt: null },
      include: { provider: true },
    });

    return this.generateTitleWithModel(
      agent.provider.protocol,
      agent.provider.baseUrl,
      agent.provider.apiKey,
      agent.modelId,
      userMessage,
      assistantMessage
    );
  }

  async generateTitleFromVersion(
    agentVersionId: string,
    userMessage: string,
    assistantMessage: string
  ): Promise<string> {
    const version = await this.prisma.agentVersion.findUniqueOrThrow({
      where: { id: agentVersionId },
      include: { provider: true },
    });

    return this.generateTitleWithModel(
      version.provider.protocol,
      version.provider.baseUrl,
      version.provider.apiKey,
      version.modelId,
      userMessage,
      assistantMessage
    );
  }

  private async generateTitleWithModel(
    protocol: string,
    baseUrl: string,
    encryptedApiKey: string,
    modelId: string,
    userMessage: string,
    assistantMessage: string
  ): Promise<string> {
    const encryptionSecret = this.config.get<string>('ENCRYPTION_SECRET')!;
    const apiKey = decrypt(encryptedApiKey, encryptionSecret);
    const model = this.createModel(protocol, baseUrl, apiKey, modelId);

    const { text } = await generateText({
      model,
      system:
        'Generate a short conversation title (max 20 characters) based on the following conversation. Return ONLY the title text, nothing else. Use the same language as the user message.',
      messages: [
        { role: 'user' as const, content: userMessage },
        { role: 'assistant' as const, content: assistantMessage },
      ],
      maxOutputTokens: 50,
    });

    return text.replace(/^["']+|["']+$/g, '').trim();
  }

  private createModel(
    protocol: string,
    baseUrl: string,
    apiKey: string,
    modelId: string
  ) {
    switch (protocol) {
      case 'OPENAI': {
        const openai = createOpenAI({ baseURL: baseUrl, apiKey });
        return openai.chat(modelId);
      }
      case 'ANTHROPIC': {
        const anthropic = createAnthropic({ baseURL: baseUrl, apiKey });
        return anthropic(modelId);
      }
      case 'GEMINI': {
        const google = createGoogleGenerativeAI({
          baseURL: baseUrl,
          apiKey,
        });
        return google(modelId);
      }
      case 'DEEPSEEK':
        return createDeepSeek({ baseURL: baseUrl, apiKey })(modelId);
      case 'QWEN':
        return createAlibaba({ baseURL: baseUrl, apiKey })(modelId);
      case 'ZHIPU':
        return createZhipu({ baseURL: baseUrl, apiKey })(modelId);
      case 'MOONSHOT':
        return createMoonshotAI({ baseURL: baseUrl, apiKey })(modelId);
      default:
        throw new Error(`Unsupported protocol: ${protocol}`);
    }
  }
}

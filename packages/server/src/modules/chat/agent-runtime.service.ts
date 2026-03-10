import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { generateText, stepCountIs, streamText, type Tool } from 'ai';

import {
  clampTemperature,
  createLanguageModel,
  getThinkingProviderOptions,
} from '../../common/ai-provider.util';
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
  readonly thinkingEnabled: boolean;
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

/** Parameters shared between createStream and createStreamFromVersion */
interface StreamParams {
  readonly protocol: string;
  readonly baseUrl: string;
  readonly encryptedApiKey: string;
  readonly modelId: string;
  readonly systemPrompt: string;
  readonly skillContents: string;
  readonly temperature: number;
  readonly maxTokens: number;
  readonly thinkingEnabled: boolean;
  readonly mcpServers: AgentWithRelations['mcpServers'];
  readonly messages: Array<{ role: string; content: string }>;
  readonly abortSignal?: AbortSignal;
  readonly conversationId?: string;
}

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

    this.logger.log(`[createStream] collecting MCP tools...`);
    const result = await this.buildAndStream({
      protocol: agent.provider.protocol,
      baseUrl: agent.provider.baseUrl,
      encryptedApiKey: agent.provider.apiKey,
      modelId: agent.modelId,
      systemPrompt: agent.systemPrompt,
      skillContents,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      thinkingEnabled: agent.thinkingEnabled,
      mcpServers: agent.mcpServers,
      messages,
      abortSignal: options?.abortSignal,
      conversationId: options?.conversationId,
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

    const mcpSnapshot = version.mcpServersSnapshot as Array<{
      transport: string;
      config: Record<string, unknown>;
      enabledTools: string[];
    }>;
    const mcpServers = mcpSnapshot.map(s => ({
      enabledTools: s.enabledTools,
      mcpServer: { transport: s.transport, config: s.config },
    }));

    return this.buildAndStream({
      protocol: version.provider.protocol,
      baseUrl: version.provider.baseUrl,
      encryptedApiKey: version.provider.apiKey,
      modelId: version.modelId,
      systemPrompt: version.systemPrompt,
      skillContents,
      temperature: version.temperature,
      maxTokens: version.maxTokens,
      thinkingEnabled: version.thinkingEnabled,
      mcpServers,
      messages,
      abortSignal: options?.abortSignal,
      conversationId: options?.conversationId,
    });
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

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async buildAndStream(params: StreamParams): Promise<any> {
    const encryptionSecret = this.config.get<string>('ENCRYPTION_SECRET')!;
    const apiKey = decrypt(params.encryptedApiKey, encryptionSecret);
    const model = createLanguageModel(
      params.protocol,
      params.baseUrl,
      apiKey,
      params.modelId
    );

    const fullSystemPrompt = params.skillContents
      ? `${params.systemPrompt}\n\n## Skills\n\n${params.skillContents}`
      : params.systemPrompt;

    const { tools: mcpTools, cleanups } = await this.collectMcpTools(
      params.mcpServers
    );
    const built = getBuiltInTools(this.workspaceService, params.conversationId);
    const tools: McpToolSet = { ...built, ...mcpTools };
    const hasTools = Object.keys(tools).length > 0;

    const thinkingOptions = getThinkingProviderOptions(
      params.protocol,
      params.thinkingEnabled,
      params.maxTokens
    );

    return streamText({
      model,
      system: fullSystemPrompt,
      messages: params.messages as any,
      temperature: params.thinkingEnabled
        ? undefined
        : clampTemperature(params.protocol, params.temperature),
      maxOutputTokens: params.maxTokens,
      experimental_telemetry: { isEnabled: true },
      ...thinkingOptions,
      ...(hasTools ? { tools, stopWhen: stepCountIs(10) } : {}),
      ...(params.abortSignal ? { abortSignal: params.abortSignal } : {}),
      onFinish: async () => {
        await this.cleanupMcpSessions(cleanups);
      },
      onError: async event => {
        this.logger.error(`[buildAndStream] streamText error: ${event.error}`);
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
    const model = createLanguageModel(protocol, baseUrl, apiKey, modelId);

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
}

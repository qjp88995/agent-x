import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  generateText,
  type ModelMessage,
  stepCountIs,
  streamText,
  type StreamTextResult,
  type Tool,
  type ToolSet,
} from 'ai';

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
import { createSkillTools, type SkillEntry } from './tools/skill-tools';

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
    readonly skillId: string;
    readonly skill: {
      readonly id: string;
      readonly name: string;
      readonly description: string | null;
      readonly content: string;
    };
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
  readonly skills: readonly SkillEntry[];
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
  ): Promise<StreamTextResult<ToolSet, never>> {
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

    const skills: SkillEntry[] = agent.skills.map(entry => ({
      skillId: entry.skillId,
      name: entry.skill.name,
      description: entry.skill.description,
      content: entry.skill.content,
    }));

    this.logger.log(`[createStream] collecting MCP tools...`);
    const result = await this.buildAndStream({
      protocol: agent.provider.protocol,
      baseUrl: agent.provider.baseUrl,
      encryptedApiKey: agent.provider.apiKey,
      modelId: agent.modelId,
      systemPrompt: agent.systemPrompt,
      skills,
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
  ): Promise<StreamTextResult<ToolSet, never>> {
    const version = await this.prisma.agentVersion.findUniqueOrThrow({
      where: { id: agentVersionId },
      include: { provider: true },
    });

    const skillsSnapshot = version.skillsSnapshot as Array<{
      skillId?: string;
      name?: string;
      content: string;
    }>;
    const skills: SkillEntry[] = skillsSnapshot.map((s, i) => ({
      skillId: s.skillId ?? String(i),
      name: s.name ?? `Skill ${i + 1}`,
      content: s.content,
    }));

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
      skills,
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

  private async buildAndStream(params: StreamParams) {
    const encryptionSecret = this.config.get<string>('ENCRYPTION_SECRET')!;
    const apiKey = decrypt(params.encryptedApiKey, encryptionSecret);
    const model = createLanguageModel(
      params.protocol,
      params.baseUrl,
      apiKey,
      params.modelId
    );

    const { tools: mcpTools, cleanups } = await this.collectMcpTools(
      params.mcpServers
    );
    const built = getBuiltInTools(this.workspaceService, params.conversationId);
    const skillTools = createSkillTools(params.skills);
    const tools: McpToolSet = { ...built, ...mcpTools, ...skillTools };
    const hasTools = Object.keys(tools).length > 0;

    const thinkingOptions = getThinkingProviderOptions(
      params.protocol,
      params.thinkingEnabled,
      params.maxTokens
    );

    return streamText({
      model,
      system: params.systemPrompt,
      messages: params.messages as ModelMessage[],
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

    const conversationText = assistantMessage
      ? `User: ${userMessage}\nAssistant: ${assistantMessage}`
      : `User: ${userMessage}`;

    const { text } = await generateText({
      model,
      system:
        'Generate a short conversation title (max 20 characters) based on the following conversation. Return ONLY the title text, nothing else. Use the same language as the user message.',
      messages: [{ role: 'user', content: conversationText }],
      maxOutputTokens: 50,
      ...getThinkingProviderOptions(protocol, false),
    });

    return text.replace(/^["']+|["']+$/g, '').trim();
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { createAlibaba } from '@ai-sdk/alibaba';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMoonshotAI } from '@ai-sdk/moonshotai';
import { createOpenAI } from '@ai-sdk/openai';
import { stepCountIs, streamText, type Tool } from 'ai';
import { createZhipu } from 'zhipu-ai-provider';

import { decrypt } from '../../common/crypto.util';
import { PrismaService } from '../../prisma/prisma.service';
import { McpClientService } from '../mcp/mcp-client.service';
import { builtInTools } from './tools';

interface AgentWithRelations {
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
    private readonly mcpClient: McpClientService
  ) {}

  async createStream(
    agentId: string,
    messages: Array<{ role: string; content: string }>,
    options?: { abortSignal?: AbortSignal }
  ): Promise<any> {
    const agent: AgentWithRelations = await this.prisma.agent.findUniqueOrThrow(
      {
        where: { id: agentId },
        include: {
          provider: true,
          skills: {
            include: { skill: true },
            orderBy: { priority: 'desc' },
          },
          mcpServers: { include: { mcpServer: true } },
        },
      }
    );

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

    const { tools: mcpTools, cleanups } = await this.collectMcpTools(
      agent.mcpServers
    );
    const tools: McpToolSet = { ...builtInTools, ...mcpTools };
    const hasTools = Object.keys(tools).length > 0;

    return streamText({
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
      onError: async () => {
        await this.cleanupMcpSessions(cleanups);
      },
    });
  }

  async createStreamFromVersion(
    agentVersionId: string,
    messages: Array<{ role: string; content: string }>,
    options?: { abortSignal?: AbortSignal }
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

    const tools: McpToolSet = { ...builtInTools, ...mcpTools };
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

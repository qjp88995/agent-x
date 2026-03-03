import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { createAlibaba } from '@ai-sdk/alibaba';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMoonshotAI } from '@ai-sdk/moonshotai';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createZhipu } from 'zhipu-ai-provider';

import { decrypt } from '../../common/crypto.util';
import { PrismaService } from '../../prisma/prisma.service';

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
}

@Injectable()
export class AgentRuntimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

   
  async createStream(
    agentId: string,
    messages: Array<{ role: string; content: string }>
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

     
    return streamText({
      model,
      system: systemPrompt,
      messages: messages as any,
      temperature: agent.temperature,
      maxOutputTokens: agent.maxTokens,
      experimental_telemetry: { isEnabled: true },
    });
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
        const google = createGoogleGenerativeAI({ baseURL: baseUrl, apiKey });
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

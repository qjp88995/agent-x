import { Injectable } from "@nestjs/common";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { decrypt } from "../../common/crypto.util";

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
    private readonly config: ConfigService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createStream(
    agentId: string,
    messages: Array<{ role: string; content: string }>,
  ): Promise<any> {
    const agent: AgentWithRelations = await this.prisma.agent.findUniqueOrThrow(
      {
        where: { id: agentId },
        include: {
          provider: true,
          skills: {
            include: { skill: true },
            orderBy: { priority: "desc" },
          },
          mcpServers: { include: { mcpServer: true } },
        },
      },
    );

    const skillContents = agent.skills
      .map((entry) => entry.skill.content)
      .join("\n\n---\n\n");
    const systemPrompt = skillContents
      ? `${agent.systemPrompt}\n\n## Skills\n\n${skillContents}`
      : agent.systemPrompt;

    const encryptionSecret = this.config.get<string>("ENCRYPTION_SECRET")!;
    const apiKey = decrypt(agent.provider.apiKey, encryptionSecret);
    const model = this.createModel(
      agent.provider.protocol,
      agent.provider.baseUrl,
      apiKey,
      agent.modelId,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return streamText({
      model,
      system: systemPrompt,
      messages: messages as any,
      temperature: agent.temperature,
      maxOutputTokens: agent.maxTokens,
    });
  }

  private createModel(
    protocol: string,
    baseUrl: string,
    apiKey: string,
    modelId: string,
  ) {
    switch (protocol) {
      case "OPENAI": {
        const openai = createOpenAI({ baseURL: baseUrl, apiKey });
        return openai(modelId);
      }
      case "ANTHROPIC": {
        const anthropic = createAnthropic({ baseURL: baseUrl, apiKey });
        return anthropic(modelId);
      }
      case "GEMINI": {
        const google = createGoogleGenerativeAI({ baseURL: baseUrl, apiKey });
        return google(modelId);
      }
      default:
        throw new Error(`Unsupported protocol: ${protocol}`);
    }
  }
}

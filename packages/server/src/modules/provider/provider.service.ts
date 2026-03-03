import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { createAlibaba } from '@ai-sdk/alibaba';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMoonshotAI } from '@ai-sdk/moonshotai';
import { createOpenAI } from '@ai-sdk/openai';
import { APICallError, generateText } from 'ai';
import { createZhipu } from 'zhipu-ai-provider';

import { decrypt,encrypt } from '../../common/crypto.util';
import { ProviderProtocol } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

export interface ModelInfo {
  readonly id: string;
  readonly name: string;
}

const ANTHROPIC_MODELS: readonly ModelInfo[] = [
  { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
  { id: 'claude-haiku-4-20250414', name: 'Claude Haiku 4' },
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
] as const;

const GEMINI_MODELS: readonly ModelInfo[] = [
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
] as const;

@Injectable()
export class ProviderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  private getEncryptionSecret(): string {
    const secret = this.configService.get<string>('ENCRYPTION_SECRET');
    if (!secret) {
      throw new Error('ENCRYPTION_SECRET is not configured');
    }
    return secret;
  }

  private maskApiKey(apiKey: string): string {
    const decrypted = decrypt(apiKey, this.getEncryptionSecret());
    const lastFour = decrypted.slice(-4);
    return `sk-...${lastFour}`;
  }

  async create(userId: string, dto: CreateProviderDto) {
    const encryptedApiKey = encrypt(dto.apiKey, this.getEncryptionSecret());

    return this.prisma.provider.create({
      data: {
        userId,
        name: dto.name,
        protocol: dto.protocol,
        baseUrl: dto.baseUrl,
        apiKey: encryptedApiKey,
      },
    });
  }

  async findAll(userId: string) {
    const providers = await this.prisma.provider.findMany({
      where: { userId },
      include: {
        models: true,
        _count: {
          select: { models: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return providers.map((provider: (typeof providers)[number]) => ({
      ...provider,
      apiKey: this.maskApiKey(provider.apiKey),
    }));
  }

  async findOne(id: string, userId: string) {
    const provider = await this.prisma.provider.findFirst({
      where: { id, userId },
      include: {
        models: true,
        _count: {
          select: { models: true },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return {
      ...provider,
      apiKey: this.maskApiKey(provider.apiKey),
    };
  }

  async update(id: string, userId: string, dto: UpdateProviderDto) {
    const provider = await this.prisma.provider.findFirst({
      where: { id, userId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const data: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.baseUrl !== undefined) {
      data.baseUrl = dto.baseUrl;
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }
    if (dto.apiKey !== undefined) {
      data.apiKey = encrypt(dto.apiKey, this.getEncryptionSecret());
    }

    return this.prisma.provider.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    const provider = await this.prisma.provider.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { agents: true },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    if (provider._count.agents > 0) {
      throw new ConflictException(
        `Cannot delete provider: ${provider._count.agents} agent(s) are still using it`
      );
    }

    await this.prisma.provider.delete({ where: { id } });

    return { message: 'Provider deleted successfully' };
  }

  async testConnection(id: string, userId: string) {
    const provider = await this.prisma.provider.findFirst({
      where: { id, userId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const apiKey = decrypt(provider.apiKey, this.getEncryptionSecret());

    try {
      const model = this.createLanguageModel(
        provider.protocol,
        provider.baseUrl,
        apiKey
      );

      await generateText({
        model,
        prompt: 'Say hello in one word.',
        maxOutputTokens: 10,
      });

      return { success: true, message: 'Connection successful' };
    } catch (error) {
      if (APICallError.isInstance(error)) {
        return {
          success: false,
          message: `Connection failed (${error.statusCode}): ${error.message}`,
        };
      }
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: `Connection failed: ${errorMessage}` };
    }
  }

  async getModels(id: string, userId: string): Promise<readonly ModelInfo[]> {
    const provider = await this.prisma.provider.findFirst({
      where: { id, userId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const apiKey = decrypt(provider.apiKey, this.getEncryptionSecret());

    switch (provider.protocol) {
      case ProviderProtocol.OPENAI:
        return this.fetchOpenAIModels(provider.baseUrl, apiKey);
      case ProviderProtocol.ANTHROPIC:
        return [...ANTHROPIC_MODELS];
      case ProviderProtocol.GEMINI:
        return [...GEMINI_MODELS];
      case ProviderProtocol.DEEPSEEK:
      case ProviderProtocol.QWEN:
      case ProviderProtocol.ZHIPU:
      case ProviderProtocol.MOONSHOT:
        return this.fetchOpenAIModels(provider.baseUrl, apiKey);
      default:
        throw new BadRequestException(
          `Unsupported protocol: ${provider.protocol as string}`
        );
    }
  }

  async syncModels(id: string, userId: string) {
    const models = await this.getModels(id, userId);

    const operations = models.map(model =>
      this.prisma.providerModel.upsert({
        where: {
          providerId_modelId: {
            providerId: id,
            modelId: model.id,
          },
        },
        create: {
          providerId: id,
          modelId: model.id,
          name: model.name,
          isActive: true,
        },
        update: {
          name: model.name,
        },
      })
    );

    const synced = await Promise.all(operations);

    return { synced: synced.length, models: synced };
  }

  private createLanguageModel(
    protocol: ProviderProtocol,
    baseUrl: string,
    apiKey: string
  ) {
    switch (protocol) {
      case ProviderProtocol.OPENAI: {
        const openai = createOpenAI({ baseURL: baseUrl, apiKey });
        return openai.chat('gpt-4o-mini');
      }
      case ProviderProtocol.ANTHROPIC: {
        const anthropic = createAnthropic({ baseURL: baseUrl, apiKey });
        return anthropic('claude-3-5-haiku-20241022');
      }
      case ProviderProtocol.GEMINI: {
        const google = createGoogleGenerativeAI({ baseURL: baseUrl, apiKey });
        return google('gemini-2.0-flash');
      }
      case ProviderProtocol.DEEPSEEK:
        return createDeepSeek({ baseURL: baseUrl, apiKey })('deepseek-chat');
      case ProviderProtocol.QWEN:
        return createAlibaba({ baseURL: baseUrl, apiKey })('qwen-turbo');
      case ProviderProtocol.ZHIPU:
        return createZhipu({ baseURL: baseUrl, apiKey })('glm-4-flash');
      case ProviderProtocol.MOONSHOT:
        return createMoonshotAI({ baseURL: baseUrl, apiKey })('moonshot-v1-8k');
      default:
        throw new BadRequestException(
          `Unsupported protocol: ${protocol as string}`
        );
    }
  }

  private async fetchOpenAIModels(
    baseUrl: string,
    apiKey: string
  ): Promise<readonly ModelInfo[]> {
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new BadRequestException(
        `Failed to fetch models: ${response.statusText}`
      );
    }

    const body = (await response.json()) as {
      data: Array<{ id: string; name?: string }>;
    };

    return body.data.map(m => ({
      id: m.id,
      name: m.name ?? m.id,
    }));
  }
}

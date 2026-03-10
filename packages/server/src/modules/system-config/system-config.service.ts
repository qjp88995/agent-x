import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { createAlibaba } from '@ai-sdk/alibaba';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMoonshotAI } from '@ai-sdk/moonshotai';
import { createOpenAI } from '@ai-sdk/openai';
import { APICallError, generateObject, generateText } from 'ai';
import { createZhipu } from 'zhipu-ai-provider';
import { z } from 'zod';

import { decrypt, encrypt } from '../../common/crypto.util';
import { ProviderProtocol } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSystemProviderDto } from './dto/create-system-provider.dto';
import { UpdateFeatureConfigDto } from './dto/update-feature-config.dto';
import { UpdateSystemProviderDto } from './dto/update-system-provider.dto';

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
export class SystemConfigService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  async onModuleInit() {
    await this.seedDefaultFeatures();
  }

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

  // --- SystemProvider CRUD ---

  async createProvider(dto: CreateSystemProviderDto) {
    const encryptedApiKey = encrypt(dto.apiKey, this.getEncryptionSecret());

    return this.prisma.systemProvider.create({
      data: {
        name: dto.name,
        protocol: dto.protocol,
        baseUrl: dto.baseUrl,
        apiKey: encryptedApiKey,
      },
    });
  }

  async findAllProviders() {
    const providers = await this.prisma.systemProvider.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return providers.map(provider => ({
      ...provider,
      apiKey: this.maskApiKey(provider.apiKey),
    }));
  }

  async findOneProvider(id: string) {
    const provider = await this.prisma.systemProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException('System provider not found');
    }

    return {
      ...provider,
      apiKey: this.maskApiKey(provider.apiKey),
    };
  }

  async updateProvider(id: string, dto: UpdateSystemProviderDto) {
    const provider = await this.prisma.systemProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException('System provider not found');
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

    return this.prisma.systemProvider.update({
      where: { id },
      data,
    });
  }

  async removeProvider(id: string) {
    const provider = await this.prisma.systemProvider.findUnique({
      where: { id },
      include: {
        _count: {
          select: { featureConfigs: true },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException('System provider not found');
    }

    if (provider._count.featureConfigs > 0) {
      throw new ConflictException(
        `Cannot delete provider: ${provider._count.featureConfigs} feature(s) are still using it`
      );
    }

    await this.prisma.systemProvider.delete({ where: { id } });

    return { message: 'System provider deleted successfully' };
  }

  async testProviderConnection(id: string) {
    const provider = await this.prisma.systemProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException('System provider not found');
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
        experimental_telemetry: { isEnabled: true },
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

  async getProviderModels(id: string): Promise<readonly ModelInfo[]> {
    const provider = await this.prisma.systemProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException('System provider not found');
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

  // --- Feature Config ---

  async findAllFeatures() {
    return this.prisma.systemFeatureConfig.findMany({
      include: { systemProvider: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateFeature(featureKey: string, dto: UpdateFeatureConfigDto) {
    const existing = await this.prisma.systemFeatureConfig.findUnique({
      where: { featureKey },
    });

    if (!existing) {
      throw new NotFoundException(`Feature config not found: ${featureKey}`);
    }

    const data: Record<string, unknown> = {};

    if (dto.systemProviderId !== undefined) {
      data.systemProviderId = dto.systemProviderId;
    }
    if (dto.modelId !== undefined) {
      data.modelId = dto.modelId;
    }
    if (dto.systemPrompt !== undefined) {
      data.systemPrompt = dto.systemPrompt;
    }
    if (dto.isEnabled !== undefined) {
      data.isEnabled = dto.isEnabled;
    }

    return this.prisma.systemFeatureConfig.update({
      where: { featureKey },
      data,
      include: { systemProvider: true },
    });
  }

  async seedDefaultFeatures() {
    await this.prisma.systemFeatureConfig.upsert({
      where: { featureKey: 'PROMPT_POLISH' },
      create: {
        featureKey: 'PROMPT_POLISH',
        isEnabled: false,
        systemPrompt:
          'You are a prompt engineering expert. Your task is to improve and polish the given system prompt. Make it clearer, more specific, and more effective while preserving the original intent. Output ONLY the improved prompt text, with no explanations or commentary.',
      },
      update: {},
    });

    await this.prisma.systemFeatureConfig.upsert({
      where: { featureKey: 'FORM_AUTO_FILL' },
      create: {
        featureKey: 'FORM_AUTO_FILL',
        isEnabled: false,
        systemPrompt:
          'Based on the provided content, generate the requested fields. Be concise and accurate. Use the same language as the input content.',
      },
      update: {},
    });
  }

  async getFeatureStatus(featureKey: string): Promise<{ enabled: boolean }> {
    const feature = await this.prisma.systemFeatureConfig.findUnique({
      where: { featureKey },
      select: {
        isEnabled: true,
        systemProviderId: true,
        modelId: true,
      },
    });

    const enabled = !!(
      feature?.isEnabled &&
      feature.systemProviderId &&
      feature.modelId
    );

    return { enabled };
  }

  // --- Polish ---

  async polishPrompt(content: string) {
    const feature = await this.prisma.systemFeatureConfig.findUnique({
      where: { featureKey: 'PROMPT_POLISH' },
      include: { systemProvider: true },
    });

    if (!feature || !feature.isEnabled) {
      throw new BadRequestException('Prompt polish feature is not enabled');
    }

    if (!feature.systemProvider) {
      throw new BadRequestException('No provider configured for prompt polish');
    }

    if (!feature.modelId) {
      throw new BadRequestException('No model configured for prompt polish');
    }

    const apiKey = decrypt(
      feature.systemProvider.apiKey,
      this.getEncryptionSecret()
    );

    const model = this.createLanguageModelWithId(
      feature.systemProvider.protocol,
      feature.systemProvider.baseUrl,
      apiKey,
      feature.modelId
    );

    const { text } = await generateText({
      model,
      system: feature.systemPrompt ?? undefined,
      prompt: content,
      experimental_telemetry: { isEnabled: true },
    });

    return { result: text };
  }

  // --- Generate (auto-fill) ---

  async generate(
    content: string,
    outputSchema: Record<string, { type: string; description: string }>
  ): Promise<Record<string, string>> {
    const feature = await this.prisma.systemFeatureConfig.findUnique({
      where: { featureKey: 'FORM_AUTO_FILL' },
      include: { systemProvider: true },
    });

    if (!feature || !feature.isEnabled) {
      throw new BadRequestException('Form auto-fill feature is not enabled');
    }

    if (!feature.systemProvider) {
      throw new BadRequestException(
        'No provider configured for form auto-fill'
      );
    }

    if (!feature.modelId) {
      throw new BadRequestException('No model configured for form auto-fill');
    }

    const apiKey = decrypt(
      feature.systemProvider.apiKey,
      this.getEncryptionSecret()
    );

    const model = this.createLanguageModelWithId(
      feature.systemProvider.protocol,
      feature.systemProvider.baseUrl,
      apiKey,
      feature.modelId
    );

    // Build Zod schema dynamically from outputSchema
    const shape: Record<string, z.ZodString> = {};
    for (const [key, field] of Object.entries(outputSchema)) {
      shape[key] = z.string().describe(field.description);
    }
    const zodSchema = z.object(shape);

    const { object } = await generateObject({
      model,
      schema: zodSchema,
      system: feature.systemPrompt ?? undefined,
      prompt: content,
      experimental_telemetry: { isEnabled: true },
    });

    return object;
  }

  // --- Private helpers ---

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

  private createLanguageModelWithId(
    protocol: ProviderProtocol,
    baseUrl: string,
    apiKey: string,
    modelId: string
  ) {
    switch (protocol) {
      case ProviderProtocol.OPENAI: {
        const openai = createOpenAI({ baseURL: baseUrl, apiKey });
        return openai.chat(modelId);
      }
      case ProviderProtocol.ANTHROPIC: {
        const anthropic = createAnthropic({ baseURL: baseUrl, apiKey });
        return anthropic(modelId);
      }
      case ProviderProtocol.GEMINI: {
        const google = createGoogleGenerativeAI({ baseURL: baseUrl, apiKey });
        return google(modelId);
      }
      case ProviderProtocol.DEEPSEEK:
        return createDeepSeek({ baseURL: baseUrl, apiKey })(modelId);
      case ProviderProtocol.QWEN:
        return createAlibaba({ baseURL: baseUrl, apiKey })(modelId);
      case ProviderProtocol.ZHIPU:
        return createZhipu({ baseURL: baseUrl, apiKey })(modelId);
      case ProviderProtocol.MOONSHOT:
        return createMoonshotAI({ baseURL: baseUrl, apiKey })(modelId);
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

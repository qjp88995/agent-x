import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { generateText, Output } from 'ai';
import { z } from 'zod';

import {
  clampTemperature,
  createLanguageModel,
  getThinkingProviderOptions,
  type ModelInfo,
  resolveModels,
  testConnection,
} from '../../common/ai-provider.util';
import { decrypt, encrypt, maskApiKey } from '../../common/crypto.util';
import { pickDefined } from '../../common/pick-defined.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProviderDto } from '../provider/dto/create-provider.dto';
import { UpdateProviderDto } from '../provider/dto/update-provider.dto';
import { UpdateFeatureConfigDto } from './dto/update-feature-config.dto';

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

  // --- SystemProvider CRUD ---

  async createProvider(dto: CreateProviderDto) {
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

    const secret = this.getEncryptionSecret();
    return providers.map(provider => ({
      ...provider,
      apiKey: maskApiKey(provider.apiKey, secret),
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
      apiKey: maskApiKey(provider.apiKey, this.getEncryptionSecret()),
    };
  }

  async updateProvider(id: string, dto: UpdateProviderDto) {
    const provider = await this.prisma.systemProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException('System provider not found');
    }

    const data = pickDefined({
      name: dto.name,
      baseUrl: dto.baseUrl,
      isActive: dto.isActive,
      apiKey:
        dto.apiKey !== undefined
          ? encrypt(dto.apiKey, this.getEncryptionSecret())
          : undefined,
    });

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
    return testConnection(provider.protocol, provider.baseUrl, apiKey);
  }

  async getProviderModels(id: string): Promise<readonly ModelInfo[]> {
    const provider = await this.prisma.systemProvider.findUnique({
      where: { id },
    });

    if (!provider) {
      throw new NotFoundException('System provider not found');
    }

    const apiKey = decrypt(provider.apiKey, this.getEncryptionSecret());
    return resolveModels(provider.protocol, provider.baseUrl, apiKey);
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

    const data = pickDefined({
      systemProviderId: dto.systemProviderId,
      modelId: dto.modelId,
      systemPrompt: dto.systemPrompt,
      isEnabled: dto.isEnabled,
      temperature: dto.temperature,
      maxTokens: dto.maxTokens,
      thinkingEnabled: dto.thinkingEnabled,
    });

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

  async polishPrompt(content: string, description?: string) {
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

    const model = createLanguageModel(
      feature.systemProvider.protocol,
      feature.systemProvider.baseUrl,
      apiKey,
      feature.modelId
    );

    const prompt = description?.trim()
      ? `User's polish instructions: ${description.trim()}\n\n---\n\n${content}`
      : content;

    const { text } = await generateText({
      model,
      system: feature.systemPrompt ?? undefined,
      prompt,
      temperature:
        feature.temperature != null
          ? clampTemperature(
              feature.systemProvider.protocol,
              feature.temperature
            )
          : undefined,
      maxOutputTokens: feature.maxTokens ?? undefined,
      experimental_telemetry: { isEnabled: true },
      ...getThinkingProviderOptions(
        feature.systemProvider.protocol,
        feature.thinkingEnabled ?? false,
        feature.maxTokens ?? undefined
      ),
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

    const model = createLanguageModel(
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

    const { output } = await generateText({
      model,
      output: Output.object({ schema: zodSchema }),
      system: feature.systemPrompt ?? undefined,
      prompt: content,
      temperature:
        feature.temperature != null
          ? clampTemperature(
              feature.systemProvider.protocol,
              feature.temperature
            )
          : undefined,
      maxOutputTokens: feature.maxTokens ?? undefined,
      experimental_telemetry: { isEnabled: true },
      ...getThinkingProviderOptions(
        feature.systemProvider.protocol,
        feature.thinkingEnabled ?? false,
        feature.maxTokens ?? undefined
      ),
    });

    return output!;
  }
}

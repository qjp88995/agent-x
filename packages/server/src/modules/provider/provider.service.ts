import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  type ModelInfo,
  resolveModels,
  testConnection,
} from '../../common/ai-provider.util';
import { decrypt, encrypt, maskApiKey } from '../../common/crypto.util';
import { pickDefined } from '../../common/pick-defined.util';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';

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

    const secret = this.getEncryptionSecret();
    return providers.map((provider: (typeof providers)[number]) => ({
      ...provider,
      apiKey: maskApiKey(provider.apiKey, secret),
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
      apiKey: maskApiKey(provider.apiKey, this.getEncryptionSecret()),
    };
  }

  async update(id: string, userId: string, dto: UpdateProviderDto) {
    const provider = await this.prisma.provider.findFirst({
      where: { id, userId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
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

  async testProviderConnection(id: string, userId: string) {
    const provider = await this.prisma.provider.findFirst({
      where: { id, userId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const apiKey = decrypt(provider.apiKey, this.getEncryptionSecret());
    return testConnection(provider.protocol, provider.baseUrl, apiKey);
  }

  async getModels(id: string, userId: string): Promise<readonly ModelInfo[]> {
    const provider = await this.prisma.provider.findFirst({
      where: { id, userId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const apiKey = decrypt(provider.apiKey, this.getEncryptionSecret());
    return resolveModels(provider.protocol, provider.baseUrl, apiKey);
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
}

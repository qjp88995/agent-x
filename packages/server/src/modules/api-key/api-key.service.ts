import { Injectable, NotFoundException } from '@nestjs/common';

import { createHash, randomBytes } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

const KEY_PREFIX = 'sk-agx-';

@Injectable()
export class ApiKeyService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateApiKeyDto) {
    const rawKey = `${KEY_PREFIX}${randomBytes(32).toString('hex')}`;
    const hashedKey = this.hashKey(rawKey);

    const record = await this.prisma.apiKey.create({
      data: {
        userId,
        name: dto.name,
        key: hashedKey,
        agentId: dto.agentId ?? null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      include: {
        agent: { select: { id: true, name: true } },
      },
    });

    return {
      ...record,
      plainKey: rawKey,
    };
  }

  async findAll(userId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { userId },
      include: {
        agent: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return keys.map((key: (typeof keys)[number]) => ({
      ...key,
      key: this.maskKey(key.key),
    }));
  }

  async remove(id: string, userId: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.userId !== userId) {
      throw new NotFoundException('API key not found');
    }

    await this.prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'API key deactivated successfully' };
  }

  async validate(
    rawKey: string
  ): Promise<{ userId: string; agentId: string | null } | null> {
    const hashedKey = this.hashKey(rawKey);

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { key: hashedKey },
    });

    if (!apiKey) {
      return null;
    }

    if (!apiKey.isActive) {
      return null;
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return null;
    }

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      userId: apiKey.userId,
      agentId: apiKey.agentId,
    };
  }

  private hashKey(rawKey: string): string {
    return createHash('sha256').update(rawKey).digest('hex');
  }

  private maskKey(hashedKey: string): string {
    const prefix = hashedKey.slice(0, 8);
    const suffix = hashedKey.slice(-4);
    return `${prefix}...${suffix}`;
  }
}

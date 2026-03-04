import { Injectable, NotFoundException } from '@nestjs/common';

import { createHash, randomBytes } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateShareTokenDto } from './dto/create-share-token.dto';

const TOKEN_PREFIX = 'shr-agx-';

@Injectable()
export class ShareTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    agentVersionId: string,
    userId: string,
    dto: CreateShareTokenDto
  ) {
    const version = await this.prisma.agentVersion.findFirst({
      where: { id: agentVersionId },
      include: { agent: { select: { userId: true } } },
    });

    if (!version || version.agent.userId !== userId) {
      throw new NotFoundException('Agent version not found');
    }

    const rawToken = `${TOKEN_PREFIX}${randomBytes(32).toString('hex')}`;
    const hashedToken = this.hashToken(rawToken);

    const record = await this.prisma.shareToken.create({
      data: {
        agentVersionId,
        token: hashedToken,
        name: dto.name,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        maxConversations: dto.maxConversations ?? null,
      },
    });

    return { ...record, plainToken: rawToken };
  }

  async findAll(agentVersionId: string, userId: string) {
    const version = await this.prisma.agentVersion.findFirst({
      where: { id: agentVersionId },
      include: { agent: { select: { userId: true } } },
    });

    if (!version || version.agent.userId !== userId) {
      throw new NotFoundException('Agent version not found');
    }

    return this.prisma.shareToken.findMany({
      where: { agentVersionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deactivate(tokenId: string, userId: string) {
    const token = await this.prisma.shareToken.findFirst({
      where: { id: tokenId },
      include: {
        agentVersion: { include: { agent: { select: { userId: true } } } },
      },
    });

    if (!token || token.agentVersion.agent.userId !== userId) {
      throw new NotFoundException('Share token not found');
    }

    return this.prisma.shareToken.update({
      where: { id: tokenId },
      data: { isActive: false },
    });
  }

  async validate(rawToken: string) {
    const hashedToken = this.hashToken(rawToken);

    const token = await this.prisma.shareToken.findUnique({
      where: { token: hashedToken },
      include: {
        agentVersion: {
          include: {
            agent: {
              select: { id: true, name: true, description: true, avatar: true },
            },
            provider: true,
          },
        },
      },
    });

    if (!token) return null;
    if (!token.isActive) return null;
    if (token.expiresAt && token.expiresAt < new Date()) return null;
    if (
      token.maxConversations !== null &&
      token.usedConversations >= token.maxConversations
    ) {
      return null;
    }

    return {
      shareTokenId: token.id,
      agentVersion: token.agentVersion,
    };
  }

  async incrementUsage(tokenId: string) {
    return this.prisma.shareToken.update({
      where: { id: tokenId },
      data: { usedConversations: { increment: 1 } },
    });
  }

  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }
}

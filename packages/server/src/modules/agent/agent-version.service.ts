import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateVersionDto } from './dto/create-version.dto';

@Injectable()
export class AgentVersionService {
  constructor(private readonly prisma: PrismaService) {}

  async publishVersion(agentId: string, userId: string, dto: CreateVersionDto) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, userId },
      include: {
        skills: {
          include: { skill: true },
          orderBy: { priority: 'desc' },
        },
        mcpServers: {
          include: { mcpServer: true },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    if (!agent.systemPrompt || !agent.providerId || !agent.modelId) {
      throw new BadRequestException(
        'Agent must have systemPrompt, providerId, and modelId to publish a version'
      );
    }

    const latestVersion = await this.prisma.agentVersion.findFirst({
      where: { agentId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const nextVersion = (latestVersion?.version ?? 0) + 1;

    const skillsSnapshot = agent.skills.map(as => ({
      skillId: as.skillId,
      name: as.skill.name,
      content: as.skill.content,
      priority: as.priority,
    }));

    const mcpServersSnapshot = agent.mcpServers.map(am => ({
      mcpServerId: am.mcpServerId,
      name: am.mcpServer.name,
      transport: am.mcpServer.transport,
      config: am.mcpServer.config as Record<string, unknown>,
      enabledTools: am.enabledTools,
    }));

    return this.prisma.agentVersion.create({
      data: {
        agentId,
        version: nextVersion,
        providerId: agent.providerId,
        modelId: agent.modelId,
        systemPrompt: agent.systemPrompt,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
        skillsSnapshot: skillsSnapshot as any,
        mcpServersSnapshot: mcpServersSnapshot as any,
        changelog: dto.changelog ?? null,
      },
    });
  }

  async findAllVersions(agentId: string, userId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, userId },
      select: { id: true },
    });
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return this.prisma.agentVersion.findMany({
      where: { agentId },
      orderBy: { version: 'desc' },
      include: {
        _count: { select: { shareTokens: true, conversations: true } },
      },
    });
  }

  async findOneVersion(agentId: string, versionId: string, userId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, userId },
      select: { id: true },
    });
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const version = await this.prisma.agentVersion.findFirst({
      where: { id: versionId, agentId },
      include: {
        shareTokens: { where: { isActive: true } },
        _count: { select: { conversations: true } },
      },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    return version;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';

import { DeleteResponse } from '@agent-x/shared';

import { pickDefined } from '../../common/pick-defined.util';
import { AgentStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AgentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAgentDto) {
    const provider = await this.prisma.provider.findFirst({
      where: { id: dto.providerId, userId },
    });

    if (!provider) {
      throw new NotFoundException(
        'Provider not found or does not belong to user'
      );
    }

    return this.prisma.agent.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        providerId: dto.providerId,
        modelId: dto.modelId,
        systemPrompt: dto.systemPrompt,
        temperature: dto.temperature,
        maxTokens: dto.maxTokens,
        thinkingEnabled: dto.thinkingEnabled,
        status: AgentStatus.ACTIVE,
      },
    });
  }

  async findAll(userId: string, status?: AgentStatus) {
    const where: {
      userId: string;
      status?: AgentStatus;
      deletedAt: null;
    } = { userId, deletedAt: null };

    if (status) {
      where.status = status;
    }

    const agents = await this.prisma.agent.findMany({
      where,
      include: {
        provider: { select: { id: true, name: true, protocol: true } },
        _count: {
          select: { skills: true, mcpServers: true },
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
          select: { version: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return agents.map(({ versions, ...agent }) => ({
      ...agent,
      latestVersion: versions[0]?.version ?? null,
    }));
  }

  async findOne(id: string, userId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        provider: { select: { id: true, name: true, protocol: true } },
        skills: {
          include: { skill: true },
          orderBy: { priority: 'desc' },
        },
        mcpServers: {
          include: { mcpServer: true },
        },
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
          select: { version: true },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    const { versions, ...rest } = agent;
    return {
      ...rest,
      latestVersion: versions[0]?.version ?? null,
    };
  }

  async update(id: string, userId: string, dto: UpdateAgentDto) {
    await this.requireAgent(id, userId);

    if (dto.providerId !== undefined) {
      const provider = await this.prisma.provider.findFirst({
        where: { id: dto.providerId, userId },
      });

      if (!provider) {
        throw new NotFoundException(
          'Provider not found or does not belong to user'
        );
      }
    }

    return this.prisma.agent.update({
      where: { id },
      data: pickDefined(dto),
    });
  }

  async archive(id: string, userId: string) {
    await this.requireAgent(id, userId);

    return this.prisma.agent.update({
      where: { id },
      data: { status: AgentStatus.ARCHIVED },
    });
  }

  async unarchive(id: string, userId: string) {
    await this.requireAgent(id, userId);

    return this.prisma.agent.update({
      where: { id },
      data: { status: AgentStatus.ACTIVE },
    });
  }

  async remove(id: string, userId: string): Promise<DeleteResponse> {
    await this.requireAgent(id, userId);

    await this.prisma.agent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Agent deleted successfully' };
  }

  async addSkill(
    agentId: string,
    userId: string,
    skillId: string,
    priority?: number
  ) {
    await this.requireAgent(agentId, userId);

    return this.prisma.agentSkill.create({
      data: {
        agentId,
        skillId,
        priority: priority ?? 0,
      },
      include: { skill: true },
    });
  }

  async removeSkill(
    agentId: string,
    userId: string,
    skillId: string
  ): Promise<DeleteResponse> {
    await this.requireAgent(agentId, userId);

    const agentSkill = await this.prisma.agentSkill.findFirst({
      where: { agentId, skillId },
    });

    if (!agentSkill) {
      throw new NotFoundException('Agent skill association not found');
    }

    await this.prisma.agentSkill.delete({
      where: { id: agentSkill.id },
    });

    return { message: 'Skill removed from agent successfully' };
  }

  async addMcpServer(
    agentId: string,
    userId: string,
    mcpServerId: string,
    enabledTools?: string[]
  ) {
    await this.requireAgent(agentId, userId);

    return this.prisma.agentMcp.create({
      data: {
        agentId,
        mcpServerId,
        enabledTools: enabledTools ?? [],
      },
      include: { mcpServer: true },
    });
  }

  async updateMcpServer(
    agentId: string,
    userId: string,
    mcpServerId: string,
    enabledTools: string[]
  ) {
    await this.requireAgent(agentId, userId);

    const agentMcp = await this.prisma.agentMcp.findFirst({
      where: { agentId, mcpServerId },
    });

    if (!agentMcp) {
      throw new NotFoundException('Agent MCP server association not found');
    }

    return this.prisma.agentMcp.update({
      where: { id: agentMcp.id },
      data: { enabledTools },
      include: { mcpServer: true },
    });
  }

  async removeMcpServer(
    agentId: string,
    userId: string,
    mcpServerId: string
  ): Promise<DeleteResponse> {
    await this.requireAgent(agentId, userId);

    const agentMcp = await this.prisma.agentMcp.findFirst({
      where: { agentId, mcpServerId },
    });

    if (!agentMcp) {
      throw new NotFoundException('Agent MCP server association not found');
    }

    await this.prisma.agentMcp.delete({
      where: { id: agentMcp.id },
    });

    return { message: 'MCP server removed from agent successfully' };
  }

  private async requireAgent(id: string, userId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
    return agent;
  }
}

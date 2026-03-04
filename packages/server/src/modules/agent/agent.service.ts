import { Injectable, NotFoundException } from '@nestjs/common';

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
        status: AgentStatus.ACTIVE,
      },
    });
  }

  async findAll(userId: string, status?: AgentStatus) {
    const where: { userId: string; status?: AgentStatus } = { userId };

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
      where: { id, userId },
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
    const agent = await this.prisma.agent.findFirst({
      where: { id, userId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

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

    const data: Record<string, unknown> = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.providerId !== undefined) data.providerId = dto.providerId;
    if (dto.modelId !== undefined) data.modelId = dto.modelId;
    if (dto.systemPrompt !== undefined) data.systemPrompt = dto.systemPrompt;
    if (dto.temperature !== undefined) data.temperature = dto.temperature;
    if (dto.maxTokens !== undefined) data.maxTokens = dto.maxTokens;
    if (dto.avatar !== undefined) data.avatar = dto.avatar;

    return this.prisma.agent.update({
      where: { id },
      data,
    });
  }

  async archive(id: string, userId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, userId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return this.prisma.agent.update({
      where: { id },
      data: { status: AgentStatus.ARCHIVED },
    });
  }

  async unarchive(id: string, userId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, userId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return this.prisma.agent.update({
      where: { id },
      data: { status: AgentStatus.ACTIVE },
    });
  }

  async remove(id: string, userId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, userId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    await this.prisma.agent.delete({ where: { id } });

    return { message: 'Agent deleted successfully' };
  }

  async addSkill(
    agentId: string,
    userId: string,
    skillId: string,
    priority?: number
  ) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, userId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    return this.prisma.agentSkill.create({
      data: {
        agentId,
        skillId,
        priority: priority ?? 0,
      },
      include: { skill: true },
    });
  }

  async removeSkill(agentId: string, userId: string, skillId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, userId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

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
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, userId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

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
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, userId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

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

  async removeMcpServer(agentId: string, userId: string, mcpServerId: string) {
    const agent = await this.prisma.agent.findFirst({
      where: { id: agentId, userId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

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
}

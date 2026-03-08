import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { McpTransport, McpType, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMcpServerDto } from './dto/create-mcp-server.dto';
import { UpdateMcpServerDto } from './dto/update-mcp-server.dto';
import { McpClientService } from './mcp-client.service';

@Injectable()
export class McpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mcpClient: McpClientService
  ) {}

  async create(userId: string, dto: CreateMcpServerDto) {
    if (dto.transport === McpTransport.STDIO) {
      throw new BadRequestException(
        'STDIO transport is only available for marketplace servers managed by administrators'
      );
    }

    return this.prisma.mcpServer.create({
      data: {
        name: dto.name,
        description: dto.description,
        transport: dto.transport,
        config: dto.config as Prisma.InputJsonValue,
        type: McpType.CUSTOM,
        createdBy: userId,
      },
    });
  }

  async findMarket() {
    return this.prisma.mcpServer.findMany({
      where: {
        OR: [{ type: McpType.OFFICIAL }, { isPublic: true }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(userId: string) {
    return this.prisma.mcpServer.findMany({
      where: {
        createdBy: userId,
        type: McpType.CUSTOM,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const mcpServer = await this.prisma.mcpServer.findUnique({
      where: { id },
    });

    if (!mcpServer) {
      throw new NotFoundException('MCP server not found');
    }

    return mcpServer;
  }

  async update(id: string, userId: string, dto: UpdateMcpServerDto) {
    const mcpServer = await this.prisma.mcpServer.findUnique({
      where: { id },
    });

    if (!mcpServer) {
      throw new NotFoundException('MCP server not found');
    }

    if (mcpServer.type === McpType.OFFICIAL) {
      throw new ForbiddenException('Cannot update OFFICIAL MCP servers');
    }

    if (mcpServer.createdBy !== userId) {
      throw new ForbiddenException('You can only update your own MCP servers');
    }

    const data: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }
    if (dto.transport !== undefined) {
      data.transport = dto.transport;
    }
    if (dto.config !== undefined) {
      data.config = dto.config;
    }

    return this.prisma.mcpServer.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    const mcpServer = await this.prisma.mcpServer.findUnique({
      where: { id },
    });

    if (!mcpServer) {
      throw new NotFoundException('MCP server not found');
    }

    if (mcpServer.type === McpType.OFFICIAL) {
      throw new ForbiddenException('Cannot delete OFFICIAL MCP servers');
    }

    if (mcpServer.createdBy !== userId) {
      throw new ForbiddenException('You can only delete your own MCP servers');
    }

    await this.prisma.mcpServer.delete({ where: { id } });

    return { message: 'MCP server deleted successfully' };
  }

  async createOfficial(dto: CreateMcpServerDto) {
    return this.prisma.mcpServer.create({
      data: {
        name: dto.name,
        description: dto.description,
        transport: dto.transport,
        config: dto.config as Prisma.InputJsonValue,
        type: McpType.OFFICIAL,
        isPublic: true,
        createdBy: null,
      },
    });
  }

  async updateOfficial(id: string, dto: UpdateMcpServerDto) {
    const mcpServer = await this.prisma.mcpServer.findUnique({
      where: { id },
    });

    if (!mcpServer) {
      throw new NotFoundException('MCP server not found');
    }

    if (mcpServer.type !== McpType.OFFICIAL) {
      throw new ForbiddenException('This server is not an OFFICIAL server');
    }

    const data: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }
    if (dto.transport !== undefined) {
      data.transport = dto.transport;
    }
    if (dto.config !== undefined) {
      data.config = dto.config;
    }

    return this.prisma.mcpServer.update({
      where: { id },
      data,
    });
  }

  async removeOfficial(id: string) {
    const mcpServer = await this.prisma.mcpServer.findUnique({
      where: { id },
    });

    if (!mcpServer) {
      throw new NotFoundException('MCP server not found');
    }

    if (mcpServer.type !== McpType.OFFICIAL) {
      throw new ForbiddenException('This server is not an OFFICIAL server');
    }

    await this.prisma.mcpServer.delete({ where: { id } });

    return { message: 'Marketplace server deleted successfully' };
  }

  async testConnection(id: string, userId: string) {
    const mcpServer = await this.prisma.mcpServer.findUnique({
      where: { id },
    });

    if (!mcpServer) {
      throw new NotFoundException('MCP server not found');
    }

    if (mcpServer.type === McpType.CUSTOM && mcpServer.createdBy !== userId) {
      throw new ForbiddenException('You can only test your own MCP servers');
    }

    try {
      const tools = await this.mcpClient.getTools(
        mcpServer.transport,
        mcpServer.config as Record<string, unknown>
      );

      await this.prisma.mcpServer.update({
        where: { id },
        data: { tools: tools as unknown as Prisma.InputJsonValue },
      });

      return {
        success: true,
        message: 'Connection successful',
        tools,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Connection failed: ${errorMessage}`,
      };
    }
  }
}

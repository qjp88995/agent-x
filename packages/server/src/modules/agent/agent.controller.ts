import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { AgentStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AgentService } from './agent.service';
import { AgentVersionService } from './agent-version.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { CreateShareTokenDto } from './dto/create-share-token.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { ShareTokenService } from './share-token.service';

@Controller('agents')
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly agentVersionService: AgentVersionService,
    private readonly shareTokenService: ShareTokenService,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  findAll(
    @CurrentUser() user: { id: string },
    @Query('status') status?: AgentStatus
  ) {
    return this.agentService.findAll(user.id, status);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateAgentDto) {
    return this.agentService.create(user.id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.agentService.findOne(id, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateAgentDto
  ) {
    return this.agentService.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.agentService.remove(id, user.id);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.agentService.archive(id, user.id);
  }

  @Post(':id/unarchive')
  unarchive(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.agentService.unarchive(id, user.id);
  }

  // --- Version Management ---

  @Post(':id/versions')
  publishVersion(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateVersionDto
  ) {
    return this.agentVersionService.publishVersion(id, user.id, dto);
  }

  @Get(':id/versions')
  findAllVersions(
    @Param('id') id: string,
    @CurrentUser() user: { id: string }
  ) {
    return this.agentVersionService.findAllVersions(id, user.id);
  }

  @Get(':id/versions/:versionId')
  findOneVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: { id: string }
  ) {
    return this.agentVersionService.findOneVersion(id, versionId, user.id);
  }

  // --- Share Tokens ---

  @Post(':id/versions/:versionId/share-tokens')
  createShareToken(
    @Param('id') _id: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateShareTokenDto
  ) {
    return this.shareTokenService.create(versionId, user.id, dto);
  }

  @Get(':id/versions/:versionId/share-tokens')
  findAllShareTokens(
    @Param('id') _id: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: { id: string }
  ) {
    return this.shareTokenService.findAll(versionId, user.id);
  }

  @Delete(':id/versions/:versionId/share-tokens/:tokenId')
  deactivateShareToken(
    @Param('id') _id: string,
    @Param('versionId') _versionId: string,
    @Param('tokenId') tokenId: string,
    @CurrentUser() user: { id: string }
  ) {
    return this.shareTokenService.deactivate(tokenId, user.id);
  }

  // --- Shared Conversations (owner viewing public chats) ---

  @Get(':id/shared-conversations')
  async findSharedConversations(
    @Param('id') id: string,
    @CurrentUser() user: { id: string }
  ) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!agent) {
      return [];
    }

    return this.prisma.conversation.findMany({
      where: {
        agentId: id,
        shareTokenId: { not: null },
      },
      include: {
        agentVersion: { select: { version: true } },
        shareToken: { select: { name: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  @Get(':id/shared-conversations/:cid/messages')
  async findSharedConversationMessages(
    @Param('id') id: string,
    @Param('cid') cid: string,
    @CurrentUser() user: { id: string }
  ) {
    const agent = await this.prisma.agent.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!agent) {
      return [];
    }

    return this.prisma.message.findMany({
      where: {
        conversationId: cid,
        conversation: { agentId: id, shareTokenId: { not: null } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // --- Skills ---

  @Post(':id/skills')
  addSkill(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: { skillId: string; priority?: number }
  ) {
    return this.agentService.addSkill(id, user.id, body.skillId, body.priority);
  }

  @Delete(':id/skills/:skillId')
  removeSkill(
    @Param('id') id: string,
    @Param('skillId') skillId: string,
    @CurrentUser() user: { id: string }
  ) {
    return this.agentService.removeSkill(id, user.id, skillId);
  }

  // --- MCP Servers ---

  @Post(':id/mcp-servers')
  addMcpServer(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: { mcpServerId: string; enabledTools?: string[] }
  ) {
    return this.agentService.addMcpServer(
      id,
      user.id,
      body.mcpServerId,
      body.enabledTools
    );
  }

  @Patch(':id/mcp-servers/:mcpServerId')
  updateMcpServer(
    @Param('id') id: string,
    @Param('mcpServerId') mcpServerId: string,
    @CurrentUser() user: { id: string },
    @Body() body: { enabledTools: string[] }
  ) {
    return this.agentService.updateMcpServer(
      id,
      user.id,
      mcpServerId,
      body.enabledTools
    );
  }

  @Delete(':id/mcp-servers/:mcpServerId')
  removeMcpServer(
    @Param('id') id: string,
    @Param('mcpServerId') mcpServerId: string,
    @CurrentUser() user: { id: string }
  ) {
    return this.agentService.removeMcpServer(id, user.id, mcpServerId);
  }
}

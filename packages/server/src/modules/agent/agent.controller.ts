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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AgentService } from './agent.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Controller('agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

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

  @Post(':id/publish')
  publish(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.agentService.publish(id, user.id);
  }

  @Post(':id/archive')
  archive(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.agentService.archive(id, user.id);
  }

  @Post(':id/unpublish')
  unpublish(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.agentService.unpublish(id, user.id);
  }

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

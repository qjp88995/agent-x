import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateMcpServerDto } from './dto/create-mcp-server.dto';
import { UpdateMcpServerDto } from './dto/update-mcp-server.dto';
import { McpService } from './mcp.service';

@Controller('mcp-servers')
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Get('market')
  findMarket() {
    return this.mcpService.findMarket();
  }

  @Post('market')
  @Roles('ADMIN')
  createOfficial(@Body() dto: CreateMcpServerDto) {
    return this.mcpService.createOfficial(dto);
  }

  @Put('market/:id')
  @Roles('ADMIN')
  updateOfficial(@Param('id') id: string, @Body() dto: UpdateMcpServerDto) {
    return this.mcpService.updateOfficial(id, dto);
  }

  @Delete('market/:id')
  @Roles('ADMIN')
  removeOfficial(@Param('id') id: string) {
    return this.mcpService.removeOfficial(id);
  }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.mcpService.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateMcpServerDto) {
    return this.mcpService.create(user.id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mcpService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateMcpServerDto
  ) {
    return this.mcpService.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.mcpService.remove(id, user.id);
  }

  @Post(':id/test')
  testConnection(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.mcpService.testConnection(id, user.id);
  }
}

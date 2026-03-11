import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { CurrentUserPayload } from '../../common/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { CreatePromptCategoryDto } from './dto/create-prompt-category.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { PromptService } from './prompt.service';

@Controller('prompts')
export class PromptController {
  constructor(private readonly promptService: PromptService) {}

  // ── Categories ──────────────────────────────────────────────

  @Get('categories')
  findCategories(@CurrentUser() user: CurrentUserPayload) {
    return this.promptService.findCategories(user.id);
  }

  @Post('categories')
  createCategory(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreatePromptCategoryDto
  ) {
    return this.promptService.createCategory(user.id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.promptService.deleteCategory(id, user.id);
  }

  // ── Marketplace (Admin) ─────────────────────────────────────

  @Get('market')
  findMarket() {
    return this.promptService.findMarket();
  }

  @Post('market')
  @Roles('ADMIN')
  createSystem(@Body() dto: CreatePromptDto) {
    return this.promptService.createSystem(dto);
  }

  @Put('market/:id')
  @Roles('ADMIN')
  updateSystem(@Param('id') id: string, @Body() dto: UpdatePromptDto) {
    return this.promptService.updateSystem(id, dto);
  }

  @Delete('market/:id')
  @Roles('ADMIN')
  removeSystem(@Param('id') id: string) {
    return this.promptService.removeSystem(id);
  }

  // ── User Custom ─────────────────────────────────────────────

  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.promptService.findAll(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreatePromptDto
  ) {
    return this.promptService.create(user.id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promptService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdatePromptDto
  ) {
    return this.promptService.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.promptService.remove(id, user.id);
  }
}

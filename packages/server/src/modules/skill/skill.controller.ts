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
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { SkillService } from './skill.service';

@Controller('skills')
export class SkillController {
  constructor(private readonly skillService: SkillService) {}

  @Get('market')
  findMarket() {
    return this.skillService.findMarket();
  }

  @Post('market')
  @Roles('ADMIN')
  createSystem(@Body() dto: CreateSkillDto) {
    return this.skillService.createSystem(dto);
  }

  @Put('market/:id')
  @Roles('ADMIN')
  updateSystem(@Param('id') id: string, @Body() dto: UpdateSkillDto) {
    return this.skillService.updateSystem(id, dto);
  }

  @Delete('market/:id')
  @Roles('ADMIN')
  removeSystem(@Param('id') id: string) {
    return this.skillService.removeSystem(id);
  }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.skillService.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateSkillDto) {
    return this.skillService.create(user.id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.skillService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateSkillDto
  ) {
    return this.skillService.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.skillService.remove(id, user.id);
  }
}

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
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { ProviderService } from './provider.service';

@Controller('providers')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.providerService.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateProviderDto) {
    return this.providerService.create(user.id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.providerService.findOne(id, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProviderDto
  ) {
    return this.providerService.update(id, user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.providerService.remove(id, user.id);
  }

  @Post(':id/test')
  testConnection(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.providerService.testProviderConnection(id, user.id);
  }

  @Get(':id/models')
  getModels(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.providerService.getModels(id, user.id);
  }

  @Post(':id/sync-models')
  syncModels(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.providerService.syncModels(id, user.id);
  }
}

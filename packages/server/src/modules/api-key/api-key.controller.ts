import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { CurrentUserPayload } from '../../common/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Controller('api-keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.apiKeyService.findAll(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateApiKeyDto
  ) {
    return this.apiKeyService.create(user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.apiKeyService.remove(id, user.id);
  }
}

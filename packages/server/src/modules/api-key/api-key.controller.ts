import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api-keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.apiKeyService.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateApiKeyDto) {
    return this.apiKeyService.create(user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.apiKeyService.remove(id, user.id);
  }
}

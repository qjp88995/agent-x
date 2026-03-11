import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateProviderDto } from '../provider/dto/create-provider.dto';
import { UpdateProviderDto } from '../provider/dto/update-provider.dto';
import { GenerateDto } from './dto/generate.dto';
import { PolishPromptDto } from './dto/polish-prompt.dto';
import { UpdateFeatureConfigDto } from './dto/update-feature-config.dto';
import { SystemConfigService } from './system-config.service';

@Controller('system')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  // --- SystemProvider CRUD ---

  @Get('providers')
  @Roles('ADMIN')
  findAllProviders() {
    return this.systemConfigService.findAllProviders();
  }

  @Post('providers')
  @Roles('ADMIN')
  createProvider(@Body() dto: CreateProviderDto) {
    return this.systemConfigService.createProvider(dto);
  }

  @Get('providers/:id')
  @Roles('ADMIN')
  findOneProvider(@Param('id') id: string) {
    return this.systemConfigService.findOneProvider(id);
  }

  @Put('providers/:id')
  @Roles('ADMIN')
  updateProvider(@Param('id') id: string, @Body() dto: UpdateProviderDto) {
    return this.systemConfigService.updateProvider(id, dto);
  }

  @Delete('providers/:id')
  @Roles('ADMIN')
  removeProvider(@Param('id') id: string) {
    return this.systemConfigService.removeProvider(id);
  }

  @Post('providers/:id/test')
  @Roles('ADMIN')
  testProviderConnection(@Param('id') id: string) {
    return this.systemConfigService.testProviderConnection(id);
  }

  @Get('providers/:id/models')
  @Roles('ADMIN')
  getProviderModels(@Param('id') id: string) {
    return this.systemConfigService.getProviderModels(id);
  }

  // --- Feature Config ---

  @Get('features')
  @Roles('ADMIN')
  findAllFeatures() {
    return this.systemConfigService.findAllFeatures();
  }

  @Put('features/:featureKey')
  @Roles('ADMIN')
  updateFeature(
    @Param('featureKey') featureKey: string,
    @Body() dto: UpdateFeatureConfigDto
  ) {
    return this.systemConfigService.updateFeature(featureKey, dto);
  }

  @Get('features/:featureKey/status')
  getFeatureStatus(@Param('featureKey') featureKey: string) {
    return this.systemConfigService.getFeatureStatus(featureKey);
  }

  // --- Polish ---

  @Post('polish')
  polishPrompt(@Body() dto: PolishPromptDto) {
    return this.systemConfigService.polishPrompt(dto.content, dto.description);
  }

  // --- Generate (auto-fill) ---

  @Post('generate')
  generate(@Body() dto: GenerateDto) {
    return this.systemConfigService
      .generate(dto.content, dto.outputSchema)
      .then(result => ({ result }));
  }
}

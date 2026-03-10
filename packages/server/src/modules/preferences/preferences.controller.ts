import { Body, Controller, Get, Patch } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { PreferencesService } from './preferences.service';

@Controller('preferences')
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get()
  get(@CurrentUser() user: { id: string }) {
    return this.preferencesService.getByUserId(user.id);
  }

  @Patch()
  update(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdatePreferencesDto
  ) {
    return this.preferencesService.update(user.id, dto);
  }
}

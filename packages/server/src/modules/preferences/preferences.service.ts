import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async getByUserId(userId: string) {
    const prefs = await this.prisma.userPreferences.findUnique({
      where: { userId },
    });

    return {
      theme: prefs?.theme ?? null,
      language: prefs?.language ?? null,
    };
  }

  async update(userId: string, dto: UpdatePreferencesDto) {
    const prefs = await this.prisma.userPreferences.upsert({
      where: { userId },
      create: {
        userId,
        theme: dto.theme,
        language: dto.language,
      },
      update: {
        ...(dto.theme !== undefined && { theme: dto.theme }),
        ...(dto.language !== undefined && { language: dto.language }),
      },
    });

    return {
      theme: prefs.theme,
      language: prefs.language,
    };
  }
}

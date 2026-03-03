import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SkillType } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';

@Injectable()
export class SkillService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateSkillDto) {
    return this.prisma.skill.create({
      data: {
        name: dto.name,
        description: dto.description,
        content: dto.content,
        tags: dto.tags ?? [],
        type: SkillType.CUSTOM,
        createdBy: userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.skill.findMany({
      where: {
        OR: [
          { createdBy: userId },
          { type: SkillType.SYSTEM },
          { isPublic: true },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    return skill;
  }

  async update(id: string, userId: string, dto: UpdateSkillDto) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    if (skill.type === SkillType.SYSTEM) {
      throw new ForbiddenException('Cannot update SYSTEM skills');
    }

    if (skill.createdBy !== userId) {
      throw new ForbiddenException('You can only update your own skills');
    }

    const data: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }
    if (dto.description !== undefined) {
      data.description = dto.description;
    }
    if (dto.content !== undefined) {
      data.content = dto.content;
    }
    if (dto.tags !== undefined) {
      data.tags = dto.tags;
    }

    return this.prisma.skill.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    if (skill.type === SkillType.SYSTEM) {
      throw new ForbiddenException('Cannot delete SYSTEM skills');
    }

    if (skill.createdBy !== userId) {
      throw new ForbiddenException('You can only delete your own skills');
    }

    await this.prisma.skill.delete({ where: { id } });

    return { message: 'Skill deleted successfully' };
  }
}

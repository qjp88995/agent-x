import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { pickDefined } from '../../common/pick-defined.util';
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

  async findMarket() {
    return this.prisma.skill.findMany({
      where: {
        OR: [{ type: SkillType.SYSTEM }, { isPublic: true }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(userId: string) {
    return this.prisma.skill.findMany({
      where: {
        createdBy: userId,
        type: SkillType.CUSTOM,
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

    return this.prisma.skill.update({
      where: { id },
      data: pickDefined(dto),
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

  async createSystem(dto: CreateSkillDto) {
    return this.prisma.skill.create({
      data: {
        name: dto.name,
        description: dto.description,
        content: dto.content,
        tags: dto.tags ?? [],
        type: SkillType.SYSTEM,
        isPublic: true,
        createdBy: null,
      },
    });
  }

  async updateSystem(id: string, dto: UpdateSkillDto) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    if (skill.type !== SkillType.SYSTEM) {
      throw new ForbiddenException('This skill is not a SYSTEM skill');
    }

    return this.prisma.skill.update({
      where: { id },
      data: pickDefined(dto),
    });
  }

  async removeSystem(id: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    if (skill.type !== SkillType.SYSTEM) {
      throw new ForbiddenException('This skill is not a SYSTEM skill');
    }

    await this.prisma.skill.delete({ where: { id } });

    return { message: 'System skill deleted successfully' };
  }
}

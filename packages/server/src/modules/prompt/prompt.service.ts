import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';

import { pickDefined } from '../../common/pick-defined.util';
import { PromptType } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { CreatePromptCategoryDto } from './dto/create-prompt-category.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';

const SYSTEM_CATEGORIES = [
  'Role Playing',
  'Code Assistant',
  'Writing',
  'Translation',
  'Analysis',
  'Education',
  'Creative',
  'Business',
  'Other',
];

@Injectable()
export class PromptService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const existing = await this.prisma.promptCategory.findMany({
      where: { type: PromptType.SYSTEM, createdBy: null },
      select: { name: true },
    });
    const existingNames = new Set(existing.map(c => c.name));
    const toCreate = SYSTEM_CATEGORIES.filter(name => !existingNames.has(name));

    if (toCreate.length > 0) {
      await this.prisma.promptCategory.createMany({
        data: toCreate.map(name => ({
          name,
          type: PromptType.SYSTEM,
          createdBy: null,
        })),
      });
    }
  }

  // ── Categories ──────────────────────────────────────────────

  async findCategories(userId: string) {
    return this.prisma.promptCategory.findMany({
      where: {
        OR: [{ type: PromptType.SYSTEM }, { createdBy: userId }],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createCategory(userId: string, dto: CreatePromptCategoryDto) {
    return this.prisma.promptCategory.create({
      data: {
        name: dto.name,
        type: PromptType.CUSTOM,
        createdBy: userId,
      },
    });
  }

  async deleteCategory(id: string, userId: string) {
    const category = await this.prisma.promptCategory.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.type === PromptType.SYSTEM) {
      throw new ForbiddenException('Cannot delete SYSTEM categories');
    }

    if (category.createdBy !== userId) {
      throw new ForbiddenException('You can only delete your own categories');
    }

    await this.prisma.promptCategory.delete({ where: { id } });

    return { message: 'Category deleted successfully' };
  }

  // ── Marketplace (Admin) ─────────────────────────────────────

  async findMarket() {
    return this.prisma.prompt.findMany({
      where: {
        OR: [{ type: PromptType.SYSTEM }, { isPublic: true }],
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSystem(dto: CreatePromptDto) {
    return this.prisma.prompt.create({
      data: {
        name: dto.name,
        description: dto.description,
        content: dto.content,
        categoryId: dto.categoryId,
        tags: dto.tags ?? [],
        type: PromptType.SYSTEM,
        isPublic: true,
        createdBy: null,
      },
      include: { category: true },
    });
  }

  async updateSystem(id: string, dto: UpdatePromptDto) {
    const prompt = await this.prisma.prompt.findUnique({
      where: { id },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    if (prompt.type !== PromptType.SYSTEM) {
      throw new ForbiddenException('This prompt is not a SYSTEM prompt');
    }

    return this.prisma.prompt.update({
      where: { id },
      data: pickDefined(dto),
      include: { category: true },
    });
  }

  async removeSystem(id: string) {
    const prompt = await this.prisma.prompt.findUnique({
      where: { id },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    if (prompt.type !== PromptType.SYSTEM) {
      throw new ForbiddenException('This prompt is not a SYSTEM prompt');
    }

    await this.prisma.prompt.delete({ where: { id } });

    return { message: 'System prompt deleted successfully' };
  }

  // ── User Custom ─────────────────────────────────────────────

  async findAll(userId: string) {
    return this.prisma.prompt.findMany({
      where: {
        createdBy: userId,
        type: PromptType.CUSTOM,
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreatePromptDto) {
    return this.prisma.prompt.create({
      data: {
        name: dto.name,
        description: dto.description,
        content: dto.content,
        categoryId: dto.categoryId,
        tags: dto.tags ?? [],
        type: PromptType.CUSTOM,
        createdBy: userId,
      },
      include: { category: true },
    });
  }

  async findOne(id: string) {
    const prompt = await this.prisma.prompt.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    return prompt;
  }

  async update(id: string, userId: string, dto: UpdatePromptDto) {
    const prompt = await this.prisma.prompt.findUnique({
      where: { id },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    if (prompt.type === PromptType.SYSTEM) {
      throw new ForbiddenException('Cannot update SYSTEM prompts');
    }

    if (prompt.createdBy !== userId) {
      throw new ForbiddenException('You can only update your own prompts');
    }

    return this.prisma.prompt.update({
      where: { id },
      data: pickDefined(dto),
      include: { category: true },
    });
  }

  async remove(id: string, userId: string) {
    const prompt = await this.prisma.prompt.findUnique({
      where: { id },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    if (prompt.type === PromptType.SYSTEM) {
      throw new ForbiddenException('Cannot delete SYSTEM prompts');
    }

    if (prompt.createdBy !== userId) {
      throw new ForbiddenException('You can only delete your own prompts');
    }

    await this.prisma.prompt.delete({ where: { id } });

    return { message: 'Prompt deleted successfully' };
  }
}

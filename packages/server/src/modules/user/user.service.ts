import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import { UserRole, UserStatus } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

@Injectable()
export class UserService {
  private static readonly BCRYPT_ROUNDS = 12;

  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListUsersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const where: Record<string, unknown> = {};

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.registeredFrom || query.registeredTo) {
      where.createdAt = {
        ...(query.registeredFrom
          ? { gte: new Date(query.registeredFrom) }
          : {}),
        ...(query.registeredTo ? { lte: new Date(query.registeredTo) } : {}),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [
      agentCount,
      conversationCount,
      workspaceFileCount,
      apiKeyCount,
      skillCount,
    ] = await Promise.all([
      this.prisma.agent.count({ where: { userId: id } }),
      this.prisma.conversation.count({ where: { userId: id } }),
      this.prisma.workspaceFile.count({
        where: { conversation: { userId: id } },
      }),
      this.prisma.apiKey.count({ where: { userId: id } }),
      this.prisma.skill.count({ where: { createdBy: id } }),
    ]);

    return {
      ...user,
      stats: {
        agentCount,
        conversationCount,
        workspaceFileCount,
        apiKeyCount,
        skillCount,
      },
    };
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      UserService.BCRYPT_ROUNDS
    );

    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        role: dto.role ?? UserRole.USER,
      },
      select: USER_SELECT,
    });
  }

  async updateRole(id: string, role: UserRole, currentUserId: string) {
    if (id === currentUserId) {
      throw new BadRequestException('Cannot change your own role');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: USER_SELECT,
    });
  }

  async updateStatus(id: string, status: UserStatus, currentUserId: string) {
    if (
      id === currentUserId &&
      (status === UserStatus.DISABLED || status === UserStatus.DELETED)
    ) {
      throw new BadRequestException(
        'Cannot disable or delete your own account'
      );
    }

    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const data: Record<string, unknown> = { status };

    if (status === UserStatus.DELETED) {
      data.deletedAt = new Date();
    } else if (
      user.status === UserStatus.DELETED &&
      status === UserStatus.ACTIVE
    ) {
      data.deletedAt = null;
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });
  }

  async resetPassword(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const temporaryPassword = crypto.randomBytes(12).toString('base64url');
    const passwordHash = await bcrypt.hash(
      temporaryPassword,
      UserService.BCRYPT_ROUNDS
    );

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return { temporaryPassword };
  }
}

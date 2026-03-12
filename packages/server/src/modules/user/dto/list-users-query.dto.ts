import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { UserRole, UserStatus } from '../../../generated/prisma/client';

export class ListUsersQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @IsString()
  @IsOptional()
  registeredFrom?: string;

  @IsString()
  @IsOptional()
  registeredTo?: string;

  @IsString()
  @IsOptional()
  sortBy?: 'createdAt' | 'name' | 'email';

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  pageSize?: number;
}

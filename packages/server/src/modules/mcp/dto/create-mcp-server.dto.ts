import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

import { McpTransport } from '../../../generated/prisma/client';

export class CreateMcpServerDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(McpTransport)
  transport!: McpTransport;

  @IsObject()
  config!: Record<string, unknown>;
}

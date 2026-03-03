import { IsEnum, IsObject, IsOptional, IsString } from "class-validator";
import { McpTransport } from "../../../generated/prisma/client";

export class UpdateMcpServerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(McpTransport)
  transport?: McpTransport;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;
}

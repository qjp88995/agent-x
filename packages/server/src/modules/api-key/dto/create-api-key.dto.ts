import { IsOptional, IsString } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  agentId?: string;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}

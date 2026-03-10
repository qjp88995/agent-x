import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateFeatureConfigDto {
  @IsOptional()
  @IsString()
  systemProviderId?: string | null;

  @IsOptional()
  @IsString()
  modelId?: string | null;

  @IsOptional()
  @IsString()
  systemPrompt?: string | null;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

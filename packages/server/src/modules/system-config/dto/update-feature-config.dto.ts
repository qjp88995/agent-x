import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

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
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxTokens?: number | null;

  @IsOptional()
  @IsBoolean()
  thinkingEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}

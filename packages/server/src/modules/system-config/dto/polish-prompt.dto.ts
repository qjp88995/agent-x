import { IsOptional, IsString, MinLength } from 'class-validator';

export class PolishPromptDto {
  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

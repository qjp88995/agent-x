import { IsString, MinLength } from 'class-validator';

export class PolishPromptDto {
  @IsString()
  @MinLength(1)
  content!: string;
}

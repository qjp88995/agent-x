import { IsString } from 'class-validator';

export class CreatePromptCategoryDto {
  @IsString()
  name!: string;
}

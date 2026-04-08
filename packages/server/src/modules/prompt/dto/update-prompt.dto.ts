import { OmitType, PartialType } from '@nestjs/mapped-types';

import { IsOptional, IsString } from 'class-validator';

import { CreatePromptDto } from './create-prompt.dto';

export class UpdatePromptDto extends PartialType(
  OmitType(CreatePromptDto, ['categoryId'] as const)
) {
  @IsOptional()
  @IsString()
  categoryId?: string | null;
}

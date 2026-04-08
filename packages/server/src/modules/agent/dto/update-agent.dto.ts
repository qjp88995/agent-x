import { PartialType } from '@nestjs/mapped-types';

import { IsOptional, IsString } from 'class-validator';

import { CreateAgentDto } from './create-agent.dto';

export class UpdateAgentDto extends PartialType(CreateAgentDto) {
  @IsOptional()
  @IsString()
  avatar?: string;
}

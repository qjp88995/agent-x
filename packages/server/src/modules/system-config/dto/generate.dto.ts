import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsObject,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

class FieldSchema {
  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;
}

export class GenerateDto {
  @IsString()
  @MinLength(1)
  content!: string;

  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => FieldSchema)
  outputSchema!: Record<string, FieldSchema>;
}

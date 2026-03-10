import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsString()
  @IsIn(['system', 'light', 'dark'])
  theme?: string | null;

  @IsOptional()
  @IsString()
  @IsIn(['en', 'zh'])
  language?: string | null;
}

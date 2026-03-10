import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateSystemProviderDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  baseUrl?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

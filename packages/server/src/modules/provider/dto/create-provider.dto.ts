import { IsEnum, IsString, IsUrl } from "class-validator";
import { ProviderProtocol } from "../../../generated/prisma/client";

export class CreateProviderDto {
  @IsString()
  name!: string;

  @IsEnum(ProviderProtocol)
  protocol!: ProviderProtocol;

  @IsUrl({ require_tld: false })
  baseUrl!: string;

  @IsString()
  apiKey!: string;
}

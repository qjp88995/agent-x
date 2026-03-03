import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ProviderModule } from "./modules/provider/provider.module";
import { AgentModule } from "./modules/agent/agent.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProviderModule,
    AgentModule,
  ],
})
export class AppModule {}

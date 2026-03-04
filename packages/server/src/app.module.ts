import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { RequestLoggerMiddleware } from './common/request-logger.middleware';
import { AgentModule } from './modules/agent/agent.module';
import { ApiKeyModule } from './modules/api-key/api-key.module';
import { AuthModule } from './modules/auth/auth.module';
import { ChatModule } from './modules/chat/chat.module';
import { McpModule } from './modules/mcp/mcp.module';
import { OpenaiCompatModule } from './modules/openai-compat/openai-compat.module';
import { ProviderModule } from './modules/provider/provider.module';
import { PublicChatModule } from './modules/public-chat/public-chat.module';
import { SkillModule } from './modules/skill/skill.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProviderModule,
    AgentModule,
    SkillModule,
    McpModule,
    ChatModule,
    PublicChatModule,
    ApiKeyModule,
    OpenaiCompatModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('{*path}');
  }
}

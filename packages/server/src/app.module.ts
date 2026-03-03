import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProviderModule } from './modules/provider/provider.module';
import { AgentModule } from './modules/agent/agent.module';
import { SkillModule } from './modules/skill/skill.module';
import { McpModule } from './modules/mcp/mcp.module';
import { ChatModule } from './modules/chat/chat.module';
import { ApiKeyModule } from './modules/api-key/api-key.module';
import { OpenaiCompatModule } from './modules/openai-compat/openai-compat.module';
import { RequestLoggerMiddleware } from './common/request-logger.middleware';

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
    ApiKeyModule,
    OpenaiCompatModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('{*path}');
  }
}

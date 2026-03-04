import { Module } from '@nestjs/common';

import { McpModule } from '../mcp/mcp.module';
import { AgentRuntimeService } from './agent-runtime.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [McpModule],
  controllers: [ChatController],
  providers: [ChatService, AgentRuntimeService],
  exports: [ChatService, AgentRuntimeService],
})
export class ChatModule {}

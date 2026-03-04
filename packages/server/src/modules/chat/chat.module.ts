import { Module } from '@nestjs/common';

import { McpModule } from '../mcp/mcp.module';
import { AgentRuntimeService } from './agent-runtime.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { StreamManagerService } from './stream-manager.service';

@Module({
  imports: [McpModule],
  controllers: [ChatController],
  providers: [ChatService, AgentRuntimeService, StreamManagerService],
  exports: [ChatService, AgentRuntimeService, StreamManagerService],
})
export class ChatModule {}

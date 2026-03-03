import { Module } from '@nestjs/common';

import { AgentRuntimeService } from './agent-runtime.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, AgentRuntimeService],
  exports: [ChatService, AgentRuntimeService],
})
export class ChatModule {}

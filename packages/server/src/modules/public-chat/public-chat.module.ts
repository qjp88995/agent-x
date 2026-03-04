import { Module } from '@nestjs/common';

import { AgentModule } from '../agent/agent.module';
import { ChatModule } from '../chat/chat.module';
import { PublicChatController } from './public-chat.controller';
import { PublicChatService } from './public-chat.service';

@Module({
  imports: [ChatModule, AgentModule],
  controllers: [PublicChatController],
  providers: [PublicChatService],
})
export class PublicChatModule {}

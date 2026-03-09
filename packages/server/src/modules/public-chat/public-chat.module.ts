import { Module } from '@nestjs/common';

import { AgentModule } from '../agent/agent.module';
import { ChatModule } from '../chat/chat.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { PublicChatController } from './public-chat.controller';
import { PublicChatService } from './public-chat.service';
import { SharedWorkspaceController } from './shared-workspace.controller';

@Module({
  imports: [ChatModule, AgentModule, WorkspaceModule],
  controllers: [PublicChatController, SharedWorkspaceController],
  providers: [PublicChatService],
})
export class PublicChatModule {}

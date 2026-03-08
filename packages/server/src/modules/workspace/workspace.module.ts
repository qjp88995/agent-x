import { forwardRef, Module } from '@nestjs/common';

import { ChatModule } from '../chat/chat.module';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

@Module({
  imports: [forwardRef(() => ChatModule)],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}

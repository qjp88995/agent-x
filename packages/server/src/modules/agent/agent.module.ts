import { Module } from '@nestjs/common';

import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentVersionService } from './agent-version.service';
import { ShareTokenService } from './share-token.service';

@Module({
  controllers: [AgentController],
  providers: [AgentService, AgentVersionService, ShareTokenService],
  exports: [AgentService, AgentVersionService, ShareTokenService],
})
export class AgentModule {}

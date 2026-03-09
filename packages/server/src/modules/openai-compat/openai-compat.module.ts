import { Module } from '@nestjs/common';

import { AgentModule } from '../agent/agent.module';
import { ApiKeyModule } from '../api-key/api-key.module';
import { ChatModule } from '../chat/chat.module';
import { OpenaiCompatController } from './openai-compat.controller';

@Module({
  imports: [ChatModule, ApiKeyModule, AgentModule],
  controllers: [OpenaiCompatController],
})
export class OpenaiCompatModule {}

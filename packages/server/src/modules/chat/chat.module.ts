import { Module } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { AgentRuntimeService } from "./agent-runtime.service";
import { ChatController } from "./chat.controller";

@Module({
  controllers: [ChatController],
  providers: [ChatService, AgentRuntimeService],
  exports: [ChatService],
})
export class ChatModule {}

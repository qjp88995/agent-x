import { Module } from "@nestjs/common";
import { OpenaiCompatController } from "./openai-compat.controller";
import { ChatModule } from "../chat/chat.module";
import { ApiKeyModule } from "../api-key/api-key.module";

@Module({
  imports: [ChatModule, ApiKeyModule],
  controllers: [OpenaiCompatController],
})
export class OpenaiCompatModule {}

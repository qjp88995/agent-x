import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
} from '@nestjs/common';

import { Response } from 'express';

import { MessageRole } from '../../generated/prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AgentRuntimeService } from './agent-runtime.service';
import { ChatService } from './chat.service';

@Controller('conversations')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly runtime: AgentRuntimeService
  ) {}

  @Post()
  createConversation(
    @CurrentUser() user: { id: string },
    @Body() body: { agentId: string; title?: string }
  ) {
    return this.chatService.createConversation(
      user.id,
      body.agentId,
      body.title
    );
  }

  @Get()
  getConversations(@CurrentUser() user: { id: string }) {
    return this.chatService.getConversations(user.id);
  }

  @Get(':id/messages')
  getMessages(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.chatService.getMessages(id, user.id);
  }

  @Post(':id/chat')
  async chat(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: { content: string },
    @Res() res: Response
  ) {
    const conversation = await this.chatService.verifyOwnership(id, user.id);

    await this.chatService.saveMessage(id, MessageRole.USER, [
      { type: 'text', text: body.content },
    ]);

    const history = await this.chatService.getMessagesForAI(id);

    const result = await this.runtime.createStream(
      conversation.agentId,
      history
    );

    // Save assistant message after streaming completes
    void result.text.then(async (text: string) => {
      const usage = await result.usage;
      await this.chatService.saveMessage(
        id,
        MessageRole.ASSISTANT,
        [{ type: 'text', text }],
        usage
      );
    });

    // Pipe the text stream directly to the response
    result.pipeTextStreamToResponse(res);
  }

  @Delete(':id')
  deleteConversation(
    @Param('id') id: string,
    @CurrentUser() user: { id: string }
  ) {
    return this.chatService.deleteConversation(id, user.id);
  }
}

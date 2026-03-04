import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
} from '@nestjs/common';

import { pipeUIMessageStreamToResponse, type UIMessage } from 'ai';
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
    @Body() body: { messages: UIMessage[] },
    @Res() res: Response
  ) {
    const conversation = await this.chatService.verifyOwnership(id, user.id);

    // Extract text from the last user message sent by useChat
    const lastMsg = body.messages[body.messages.length - 1];
    const content = lastMsg.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map(p => p.text)
      .join('');

    await this.chatService.saveMessage(id, MessageRole.USER, [
      { type: 'text', text: content },
    ]);

    const history = await this.chatService.getMessagesForAI(id);

    const result = await this.runtime.createStream(
      conversation.agentId,
      history
    );

    // Save assistant message asynchronously after stream completes
    void result.text.then(async (text: string) => {
      const reasoning = await result.reasoning;
      const usage = await result.usage;
      const parts: Array<{ type: string; text: string }> = [];

      if (reasoning) {
        const reasoningText = Array.isArray(reasoning)
          ? reasoning.map(r => r.text).join('')
          : String(reasoning);
        if (reasoningText) {
          parts.push({ type: 'reasoning', text: reasoningText });
        }
      }
      parts.push({ type: 'text', text });

      await this.chatService.saveMessage(
        id,
        MessageRole.ASSISTANT,
        parts,
        usage
      );
    });

    // Stream using AI SDK UI Message Stream protocol
    pipeUIMessageStreamToResponse({
      response: res,
      stream: result.toUIMessageStream({ sendReasoning: true }),
    });
  }

  @Delete(':id')
  deleteConversation(
    @Param('id') id: string,
    @CurrentUser() user: { id: string }
  ) {
    return this.chatService.deleteConversation(id, user.id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Res,
} from '@nestjs/common';

import {
  pipeUIMessageStreamToResponse,
  type UIMessage,
  type UIMessageChunk,
} from 'ai';
import { randomUUID } from 'crypto';
import { Response } from 'express';

import { MessageRole } from '../../generated/prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AgentRuntimeService } from './agent-runtime.service';
import { ChatService } from './chat.service';
import { StreamManagerService } from './stream-manager.service';
import {
  extractPartsFromBuffer,
  extractPartsFromSteps,
} from './stream-parts-extractor';

@Controller('conversations')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly runtime: AgentRuntimeService,
    private readonly streamManager: StreamManagerService
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
  @HttpCode(202)
  async chat(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: { messages: UIMessage[] }
  ) {
    const conversation = await this.chatService.verifyOwnership(id, user.id);

    const lastMsg = body.messages[body.messages.length - 1];
    const content = lastMsg.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map(p => p.text)
      .join('');

    await this.chatService.saveMessage(id, MessageRole.USER, [
      { type: 'text', text: content },
    ]);

    const history = await this.chatService.getMessagesForAI(id);
    const messageId = randomUUID();
    const abortController = new AbortController();

    const result = await this.runtime.createStream(
      conversation.agentId,
      history,
      { abortSignal: abortController.signal }
    );

    const uiStream = result.toUIMessageStream({ sendReasoning: true });

    this.streamManager.startStream({
      messageId,
      conversationId: id,
      stream: uiStream,
      abortController,
      onComplete: async () => {
        try {
          const steps = await result.steps;
          const usage = await result.usage;
          const parts = extractPartsFromSteps(steps);

          await this.chatService.saveMessageWithId(
            messageId,
            id,
            MessageRole.ASSISTANT,
            parts,
            usage
          );
        } catch {
          // If steps fail (e.g. aborted), extract parts from buffered chunks
          const session = this.streamManager.getSession(messageId);
          if (session && session.buffer.length > 0) {
            const parts = extractPartsFromBuffer(session.buffer);
            if (parts.length > 0) {
              await this.chatService.saveMessageWithId(
                messageId,
                id,
                MessageRole.ASSISTANT,
                parts
              );
            }
          }
        }
      },
    });

    return { messageId };
  }

  @Get(':id/messages/:messageId/stream')
  async streamMessage(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: { id: string },
    @Res() res: Response
  ) {
    await this.chatService.verifyOwnership(id, user.id);

    const session = this.streamManager.getSession(messageId);
    if (!session || session.conversationId !== id) {
      res.status(404).json({ error: 'Stream not found' });
      return;
    }

    let onChunk: ((c: UIMessageChunk) => void) | undefined;
    let onEnd: (() => void) | undefined;

    const stream = new ReadableStream<UIMessageChunk>({
      start(controller) {
        for (const chunk of session.buffer) {
          controller.enqueue(chunk);
        }
        if (session.status !== 'streaming') {
          controller.close();
          return;
        }
        onChunk = (c: UIMessageChunk) => {
          try {
            controller.enqueue(c);
          } catch {
            // Controller already closed
          }
        };
        onEnd = () => {
          try {
            controller.close();
          } catch {
            // Controller already closed
          }
        };
        session.emitter.on('chunk', onChunk);
        session.emitter.once('end', onEnd);
      },
      cancel() {
        if (onChunk) session.emitter.off('chunk', onChunk);
        if (onEnd) session.emitter.off('end', onEnd);
      },
    });

    res.on('close', () => {
      if (onChunk) session.emitter.off('chunk', onChunk);
      if (onEnd) session.emitter.off('end', onEnd);
    });

    pipeUIMessageStreamToResponse({ response: res, stream });
  }

  @Get(':id/active-stream')
  async getActiveStream(
    @Param('id') id: string,
    @CurrentUser() user: { id: string }
  ) {
    await this.chatService.verifyOwnership(id, user.id);

    const session = this.streamManager.getActiveSessionForConversation(id);
    return { messageId: session?.messageId ?? null };
  }

  @Post(':id/messages/:messageId/stop')
  @HttpCode(200)
  async stopStream(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: { id: string }
  ) {
    await this.chatService.verifyOwnership(id, user.id);

    const stopped = this.streamManager.abortStream(messageId);
    return { stopped };
  }

  @Delete(':id')
  deleteConversation(
    @Param('id') id: string,
    @CurrentUser() user: { id: string }
  ) {
    return this.chatService.deleteConversation(id, user.id);
  }
}

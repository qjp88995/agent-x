import {
  Body,
  Controller,
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
import { Public } from '../auth/decorators/public.decorator';
import { AgentRuntimeService } from '../chat/agent-runtime.service';
import { ChatService } from '../chat/chat.service';
import { StreamManagerService } from '../chat/stream-manager.service';
import {
  extractPartsFromBuffer,
  extractPartsFromSteps,
} from '../chat/stream-parts-extractor';
import { PublicChatService } from './public-chat.service';

@Public()
@Controller('shared')
export class PublicChatController {
  constructor(
    private readonly publicChatService: PublicChatService,
    private readonly runtime: AgentRuntimeService,
    private readonly streamManager: StreamManagerService,
    private readonly chatService: ChatService
  ) {}

  @Get(':token/info')
  getAgentInfo(@Param('token') token: string) {
    return this.publicChatService.getAgentInfo(token);
  }

  @Post(':token/conversations')
  createConversation(@Param('token') token: string) {
    return this.publicChatService.createConversation(token);
  }

  @Get(':token/conversations')
  getConversations(@Param('token') token: string) {
    return this.publicChatService.getConversations(token);
  }

  @Get(':token/conversations/:id/messages')
  getMessages(@Param('token') token: string, @Param('id') id: string) {
    return this.publicChatService.getMessages(token, id);
  }

  @Post(':token/conversations/:id/chat')
  @HttpCode(202)
  async chat(
    @Param('token') token: string,
    @Param('id') id: string,
    @Body() body: { messages: UIMessage[] }
  ) {
    const conversation = await this.publicChatService.verifyAccess(token, id);

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

    const agentVersionId = conversation.agentVersionId!;
    const result = await this.runtime.createStreamFromVersion(
      agentVersionId,
      history,
      { abortSignal: abortController.signal, conversationId: id }
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

  @Get(':token/conversations/:id/messages/:messageId/stream')
  async streamMessage(
    @Param('token') token: string,
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @Res() res: Response
  ) {
    await this.publicChatService.verifyAccess(token, id);

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

  @Get(':token/conversations/:id/active-stream')
  async getActiveStream(
    @Param('token') token: string,
    @Param('id') id: string
  ) {
    await this.publicChatService.verifyAccess(token, id);

    const session = this.streamManager.getActiveSessionForConversation(id);
    return { messageId: session?.messageId ?? null };
  }

  @Post(':token/conversations/:id/messages/:messageId/stop')
  @HttpCode(200)
  async stopStream(
    @Param('token') token: string,
    @Param('id') id: string,
    @Param('messageId') messageId: string
  ) {
    await this.publicChatService.verifyAccess(token, id);

    const stopped = this.streamManager.abortStream(messageId);
    return { stopped };
  }
}

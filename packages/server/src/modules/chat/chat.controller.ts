import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';

import { type UIMessage } from 'ai';
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
  extractUserMessageContent,
} from './stream-parts-extractor';

@Controller('conversations')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

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
    const start = Date.now();
    this.logger.log(`[chat] START conversationId=${id} userId=${user.id}`);

    const conversation = await this.chatService.verifyOwnership(id, user.id);
    this.logger.log(
      `[chat] verifyOwnership OK agentId=${conversation.agentId} +${Date.now() - start}ms`
    );

    const content = extractUserMessageContent(body.messages);

    await this.chatService.saveMessage(id, MessageRole.USER, [
      { type: 'text', text: content },
    ]);
    this.logger.log(`[chat] saveMessage OK +${Date.now() - start}ms`);

    const history = await this.chatService.getMessagesForAI(id);
    this.logger.log(
      `[chat] getMessagesForAI OK count=${history.length} +${Date.now() - start}ms`
    );

    const messageId = randomUUID();
    const abortController = new AbortController();

    this.logger.log(`[chat] creating stream...`);
    const result = await this.runtime.createStream(
      conversation.agentId,
      history,
      { abortSignal: abortController.signal, conversationId: id }
    );
    this.logger.log(
      `[chat] createStream OK messageId=${messageId} +${Date.now() - start}ms`
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

          await this.chatService.saveMessage(
            id,
            MessageRole.ASSISTANT,
            parts,
            usage,
            messageId
          );
          this.logger.log(
            `[chat] onComplete OK messageId=${messageId} usage=${JSON.stringify(usage)}`
          );

          // Auto-generate title on first conversation round
          this.maybeGenerateTitle(id, conversation.agentId, content).catch(
            err =>
              this.logger.warn(
                `[chat] title generation failed conversationId=${id}: ${err}`
              )
          );
        } catch (err) {
          this.logger.warn(
            `[chat] onComplete steps failed messageId=${messageId}: ${err}`
          );
          // If steps fail (e.g. aborted), extract parts from buffered chunks
          const session = this.streamManager.getSession(messageId);
          if (session && session.buffer.length > 0) {
            const parts = extractPartsFromBuffer(session.buffer);
            if (parts.length > 0) {
              await this.chatService.saveMessage(
                id,
                MessageRole.ASSISTANT,
                parts,
                undefined,
                messageId
              );
            }
          }
        }
      },
    });

    this.logger.log(
      `[chat] DONE messageId=${messageId} total=${Date.now() - start}ms`
    );
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

    this.streamManager.pipeSessionToResponse(session, res);
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

  @Patch(':id')
  async renameConversation(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: { title: string }
  ) {
    await this.chatService.verifyOwnership(id, user.id);
    await this.chatService.updateTitle(id, body.title);
    return { message: 'Conversation renamed successfully' };
  }

  @Delete(':id')
  deleteConversation(
    @Param('id') id: string,
    @CurrentUser() user: { id: string }
  ) {
    return this.chatService.deleteConversation(id, user.id);
  }

  private async maybeGenerateTitle(
    conversationId: string,
    agentId: string,
    userMessage: string
  ): Promise<void> {
    // Only generate on first round (2 messages: 1 user + 1 assistant)
    const count = await this.chatService.getMessageCount(conversationId);
    if (count !== 2) return;

    const title = await this.chatService.getConversationTitle(conversationId);
    if (title && title !== 'New Chat') return;

    const messages = await this.chatService.getMessagesForAI(conversationId);
    const assistantMsg = messages.find(m => m.role === 'assistant');
    if (!assistantMsg) return;

    const generated = await this.runtime.generateTitle(
      agentId,
      userMessage,
      assistantMsg.content
    );

    if (generated) {
      await this.chatService.updateTitle(conversationId, generated);
      this.logger.log(
        `[chat] title generated conversationId=${conversationId} title="${generated}"`
      );
    }
  }
}

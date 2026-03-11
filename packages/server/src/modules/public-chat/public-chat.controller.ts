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
import { Public } from '../auth/decorators/public.decorator';
import { AgentRuntimeService } from '../chat/agent-runtime.service';
import { ChatService } from '../chat/chat.service';
import { StreamManagerService } from '../chat/stream-manager.service';
import {
  extractPartsFromBuffer,
  extractPartsFromSteps,
  extractUserMessageContent,
} from '../chat/stream-parts-extractor';
import { PublicChatService } from './public-chat.service';

@Public()
@Controller('shared')
export class PublicChatController {
  private readonly logger = new Logger(PublicChatController.name);

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

  @Delete(':token/conversations/:id')
  async deleteConversation(
    @Param('token') token: string,
    @Param('id') id: string
  ) {
    await this.publicChatService.deleteConversation(token, id);
    return { success: true };
  }

  @Patch(':token/conversations/:id')
  async renameConversation(
    @Param('token') token: string,
    @Param('id') id: string,
    @Body() body: { title: string }
  ) {
    await this.publicChatService.renameConversation(token, id, body.title);
    return { success: true };
  }

  @Post(':token/conversations/:id/chat')
  @HttpCode(202)
  async chat(
    @Param('token') token: string,
    @Param('id') id: string,
    @Body() body: { messages: UIMessage[] }
  ) {
    const conversation = await this.publicChatService.verifyAccess(token, id);

    const content = extractUserMessageContent(body.messages);

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

          await this.chatService.saveMessage(
            id,
            MessageRole.ASSISTANT,
            parts,
            usage,
            messageId
          );

          this.maybeGenerateTitle(id, agentVersionId, content).catch(err =>
            this.logger.warn(
              `[shared-chat] title generation failed conversationId=${id}: ${err}`
            )
          );
        } catch {
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

    this.streamManager.pipeSessionToResponse(session, res);
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

  private async maybeGenerateTitle(
    conversationId: string,
    agentVersionId: string,
    userMessage: string
  ): Promise<void> {
    const count = await this.chatService.getMessageCount(conversationId);
    if (count !== 2) return;

    const title = await this.chatService.getConversationTitle(conversationId);
    if (title && title !== 'New Chat') return;

    const messages = await this.chatService.getMessagesForAI(conversationId);
    const assistantMsg = messages.find(m => m.role === 'assistant');
    if (!assistantMsg) return;

    const generated = await this.runtime.generateTitleFromVersion(
      agentVersionId,
      userMessage,
      assistantMsg.content
    );

    if (generated) {
      await this.chatService.updateTitle(conversationId, generated);
      this.logger.log(
        `[shared-chat] title generated conversationId=${conversationId} title="${generated}"`
      );
    }
  }
}

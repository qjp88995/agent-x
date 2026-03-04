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
    void result.steps.then(async (steps: Array<Record<string, any>>) => {
      const usage = await result.usage;
      const parts: Array<Record<string, unknown>> = [];

      for (const step of steps) {
        // Reasoning
        if (step.reasoning) {
          const reasoningText = Array.isArray(step.reasoning)
            ? step.reasoning.map((r: { text: string }) => r.text).join('')
            : String(step.reasoning);
          if (reasoningText) {
            parts.push({ type: 'reasoning', text: reasoningText });
          }
        }

        // Text before tool calls
        if (step.text && step.toolCalls?.length > 0) {
          parts.push({ type: 'text', text: step.text });
        }

        // Tool calls
        for (const tc of step.toolCalls ?? []) {
          parts.push({
            type: 'tool-call',
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            args: tc.args,
          });
        }

        // Tool results
        for (const tr of step.toolResults ?? []) {
          parts.push({
            type: 'tool-result',
            toolCallId: tr.toolCallId,
            toolName: tr.toolName,
            result: tr.result,
            isError: false,
          });
        }

        // Final text (no tool calls in this step)
        if (step.text && !step.toolCalls?.length) {
          parts.push({ type: 'text', text: step.text });
        }
      }

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

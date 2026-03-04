import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  Res,
} from '@nestjs/common';

import { Request, Response } from 'express';

import { ApiKeyService } from '../api-key/api-key.service';
import { Public } from '../auth/decorators/public.decorator';
import { AgentRuntimeService } from '../chat/agent-runtime.service';

const API_KEY_PREFIX = 'sk-agx-';

@Public()
@Controller('v1')
export class OpenaiCompatController {
  constructor(
    private readonly runtime: AgentRuntimeService,
    private readonly apiKeyService: ApiKeyService
  ) {}

  @Post('chat/completions')
  async chatCompletions(
    @Body()
    body: {
      model?: string;
      messages: Array<{ role: string; content: string }>;
      stream?: boolean;
    },
    @Req() req: Request,
    @Res() res: Response
  ) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith(`Bearer ${API_KEY_PREFIX}`)) {
      res.status(401).json({
        error: { message: 'Invalid API key', type: 'invalid_request_error' },
      });
      return;
    }

    const rawKey = authHeader.replace('Bearer ', '');
    const keyData = await this.apiKeyService.validate(rawKey);

    if (!keyData) {
      res.status(401).json({
        error: {
          message: 'Invalid or expired API key',
          type: 'invalid_request_error',
        },
      });
      return;
    }

    const agentId = keyData.agentId ?? body.model;

    if (!agentId) {
      res.status(400).json({
        error: {
          message:
            'model field is required when API key is not bound to an agent',
          type: 'invalid_request_error',
        },
      });
      return;
    }

    const abortController = new AbortController();
    req.on('close', () => {
      abortController.abort();
    });

    try {
      const result = await this.runtime.createStream(agentId, body.messages, {
        abortSignal: abortController.signal,
      });

      if (body.stream !== false) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        try {
          for await (const chunk of result.textStream) {
            if (abortController.signal.aborted) break;
            const data = {
              id: `chatcmpl-${Date.now()}`,
              object: 'chat.completion.chunk',
              created: Math.floor(Date.now() / 1000),
              model: agentId,
              choices: [
                {
                  index: 0,
                  delta: { content: chunk },
                  finish_reason: null,
                },
              ],
            };
            res.write(`data: ${JSON.stringify(data)}\n\n`);
          }
        } catch (err: unknown) {
          if (!abortController.signal.aborted) {
            throw err;
          }
        }

        if (!res.writableEnded) {
          res.write('data: [DONE]\n\n');
          res.end();
        }
      } else {
        const text = await result.text;
        const usage = await result.usage;

        res.json({
          id: `chatcmpl-${Date.now()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: agentId,
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: text },
              finish_reason: 'stop',
            },
          ],
          usage: {
            prompt_tokens: usage?.promptTokens ?? 0,
            completion_tokens: usage?.completionTokens ?? 0,
            total_tokens: usage?.totalTokens ?? 0,
          },
        });
      }
    } catch (error: unknown) {
      if (abortController.signal.aborted) {
        if (!res.writableEnded) {
          res.end();
        }
        return;
      }
      if (error instanceof BadRequestException) {
        if (!res.headersSent) {
          res.status(403).json({
            error: {
              message: error.message,
              type: 'invalid_request_error',
            },
          });
        }
        return;
      }
      const message =
        error instanceof Error ? error.message : 'Internal server error';
      if (!res.headersSent) {
        res.status(500).json({
          error: { message, type: 'server_error' },
        });
      }
    }
  }
}

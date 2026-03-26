import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { pipeUIMessageStreamToResponse, type UIMessageChunk } from 'ai';
import { EventEmitter } from 'events';
import type { Response } from 'express';

type StreamStatus = 'streaming' | 'completed' | 'error';

export interface StreamSession {
  readonly messageId: string;
  readonly conversationId: string;
  readonly buffer: UIMessageChunk[];
  status: StreamStatus;
  error?: string;
  readonly abortController: AbortController;
  readonly emitter: EventEmitter;
  readonly createdAt: number;
  completedAt?: number;
}

interface StartStreamOptions {
  readonly messageId: string;
  readonly conversationId: string;
  readonly stream: AsyncIterable<UIMessageChunk>;
  readonly abortController: AbortController;
  readonly onComplete: () => Promise<void>;
}

@Injectable()
export class StreamManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(StreamManagerService.name);
  private readonly sessions = new Map<string, StreamSession>();
  private cleanupTimer?: ReturnType<typeof setInterval>;

  private static readonly CLEANUP_INTERVAL_MS = 60_000;
  private static readonly SESSION_TTL_MS = 5 * 60_000;

  onModuleInit() {
    this.cleanupTimer = setInterval(
      () => this.cleanup(),
      StreamManagerService.CLEANUP_INTERVAL_MS
    );
  }

  onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    for (const session of this.sessions.values()) {
      session.abortController.abort();
      session.emitter.removeAllListeners();
    }
    this.sessions.clear();
  }

  startStream(options: StartStreamOptions): void {
    const { messageId, conversationId, stream, abortController, onComplete } =
      options;

    const session: StreamSession = {
      messageId,
      conversationId,
      buffer: [],
      status: 'streaming',
      abortController,
      emitter: new EventEmitter(),
      createdAt: Date.now(),
    };

    this.sessions.set(messageId, session);

    void this.consumeStream(session, stream, onComplete);
  }

  getSession(messageId: string): StreamSession | undefined {
    return this.sessions.get(messageId);
  }

  getActiveSessionForConversation(
    conversationId: string
  ): StreamSession | undefined {
    for (const session of this.sessions.values()) {
      if (
        session.conversationId === conversationId &&
        session.status === 'streaming'
      ) {
        return session;
      }
    }
    return undefined;
  }

  abortStream(messageId: string): boolean {
    const session = this.sessions.get(messageId);
    if (!session || session.status !== 'streaming') {
      return false;
    }
    session.abortController.abort();
    return true;
  }

  /**
   * Build a ReadableStream from a session's buffer and live events,
   * then pipe it to the HTTP response as an SSE stream.
   */
  pipeSessionToResponse(session: StreamSession, res: Response): void {
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
      if (onChunk) {
        session.emitter.off('chunk', onChunk);
        onChunk = undefined;
      }
      if (onEnd) {
        session.emitter.off('end', onEnd);
        // Actively close ReadableStream B so pipeUIMessageStreamToResponse
        // can exit cleanly instead of waiting indefinitely for more chunks.
        onEnd();
        onEnd = undefined;
      }
    });

    pipeUIMessageStreamToResponse({ response: res, stream });
  }

  private async consumeStream(
    session: StreamSession,
    stream: AsyncIterable<UIMessageChunk>,
    onComplete: () => Promise<void>
  ): Promise<void> {
    try {
      for await (const chunk of stream) {
        if (session.abortController.signal.aborted) {
          break;
        }
        session.buffer.push(chunk);
        session.emitter.emit('chunk', chunk);
      }
      session.status = 'completed';
      session.completedAt = Date.now();
      session.emitter.emit('end');

      try {
        await onComplete();
      } catch (err) {
        this.logger.error(`onComplete callback failed: ${err}`);
      }
    } catch (err: unknown) {
      const isAborted = session.abortController.signal.aborted;
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown stream error';

      if (isAborted) {
        this.logger.log(`Stream aborted for ${session.messageId}`);
        session.status = 'completed';
      } else {
        this.logger.error(
          `Stream error for ${session.messageId}: ${errorMessage}`
        );
        session.status = 'error';
        session.error = errorMessage;
      }

      session.completedAt = Date.now();
      session.emitter.emit('end');

      try {
        await onComplete();
      } catch (cbErr) {
        this.logger.error(
          `onComplete callback failed after ${isAborted ? 'abort' : 'error'}: ${cbErr}`
        );
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (
        session.completedAt &&
        now - session.completedAt > StreamManagerService.SESSION_TTL_MS
      ) {
        session.emitter.removeAllListeners();
        this.sessions.delete(id);
      }
    }
  }
}

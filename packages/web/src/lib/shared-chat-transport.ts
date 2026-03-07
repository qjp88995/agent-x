import { type ChatTransport, type UIMessage, type UIMessageChunk } from 'ai';

import { StreamResponseParser } from './stream-parser';

export class SharedChatTransport implements ChatTransport<UIMessage> {
  private readonly token: string;
  private readonly conversationId: string;
  private readonly parser = new StreamResponseParser();
  private lastMessageId: string | null = null;
  private activeStreamController: AbortController | null = null;

  constructor(token: string, conversationId: string) {
    this.token = token;
    this.conversationId = conversationId;
  }

  destroy(): void {
    this.activeStreamController?.abort();
    this.activeStreamController = null;
  }

  async sendMessages(
    options: Parameters<ChatTransport<UIMessage>['sendMessages']>[0]
  ): Promise<ReadableStream<UIMessageChunk>> {
    const { messages, abortSignal } = options;

    const chatRes = await fetch(
      `/api/shared/${this.token}/conversations/${this.conversationId}/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
        signal: abortSignal,
      }
    );

    if (!chatRes.ok) {
      throw new Error(`Chat request failed: ${chatRes.status}`);
    }

    const { messageId } = (await chatRes.json()) as { messageId: string };
    this.lastMessageId = messageId;

    return this.connectToStream(messageId, abortSignal);
  }

  async reconnectToStream(
    _options: Parameters<ChatTransport<UIMessage>['reconnectToStream']>[0]
  ): Promise<ReadableStream<UIMessageChunk> | null> {
    const res = await fetch(
      `/api/shared/${this.token}/conversations/${this.conversationId}/active-stream`
    );

    if (!res.ok) return null;

    const { messageId } = (await res.json()) as { messageId: string | null };
    if (!messageId) return null;

    this.lastMessageId = messageId;
    return this.connectToStream(messageId);
  }

  getLastMessageId(): string | null {
    return this.lastMessageId;
  }

  async stopStream(): Promise<void> {
    if (!this.lastMessageId) return;

    // Abort the client-side SSE connection so the browser stops reading
    this.activeStreamController?.abort();
    this.activeStreamController = null;

    // Tell the server to stop generating
    await fetch(
      `/api/shared/${this.token}/conversations/${this.conversationId}/messages/${this.lastMessageId}/stop`,
      { method: 'POST' }
    ).catch(() => {
      // Best effort
    });
  }

  private async connectToStream(
    messageId: string,
    abortSignal?: AbortSignal
  ): Promise<ReadableStream<UIMessageChunk>> {
    this.activeStreamController?.abort();

    const controller = new AbortController();
    this.activeStreamController = controller;

    if (abortSignal) {
      if (abortSignal.aborted) {
        controller.abort();
      } else {
        abortSignal.addEventListener('abort', () => controller.abort(), {
          once: true,
        });
      }
    }

    const streamRes = await fetch(
      `/api/shared/${this.token}/conversations/${this.conversationId}/messages/${messageId}/stream`,
      { signal: controller.signal }
    );

    if (!streamRes.ok || !streamRes.body) {
      throw new Error(`Stream connection failed: ${streamRes.status}`);
    }

    return this.parser.parseStream(streamRes.body);
  }
}

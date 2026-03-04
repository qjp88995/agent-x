import {
  type ChatTransport,
  DefaultChatTransport,
  type UIMessage,
  type UIMessageChunk,
} from 'ai';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Reuses DefaultChatTransport's SSE parsing capability to convert
 * a raw byte stream into UIMessageChunk objects.
 */
class StreamResponseParser extends DefaultChatTransport {
  constructor() {
    super({ api: '' });
  }

  parseStream(
    stream: ReadableStream<Uint8Array>
  ): ReadableStream<UIMessageChunk> {
    return this.processResponseStream(stream);
  }
}

export class AgentXChatTransport implements ChatTransport<UIMessage> {
  private readonly conversationId: string;
  private readonly parser = new StreamResponseParser();
  private lastMessageId: string | null = null;

  constructor(conversationId: string) {
    this.conversationId = conversationId;
  }

  async sendMessages(
    options: Parameters<ChatTransport<UIMessage>['sendMessages']>[0]
  ): Promise<ReadableStream<UIMessageChunk>> {
    const { messages, abortSignal } = options;

    // Step 1: POST to start the stream, get messageId
    const chatRes = await fetch(
      `/api/conversations/${this.conversationId}/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ messages }),
        signal: abortSignal,
      }
    );

    if (!chatRes.ok) {
      throw new Error(`Chat request failed: ${chatRes.status}`);
    }

    const { messageId } = (await chatRes.json()) as { messageId: string };
    this.lastMessageId = messageId;

    // Step 2: Connect to SSE stream
    return this.connectToStream(messageId, abortSignal);
  }

  async reconnectToStream(
    _options: Parameters<ChatTransport<UIMessage>['reconnectToStream']>[0]
  ): Promise<ReadableStream<UIMessageChunk> | null> {
    // Check for active stream
    const res = await fetch(
      `/api/conversations/${this.conversationId}/active-stream`,
      {
        headers: getAuthHeaders(),
      }
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
    await fetch(
      `/api/conversations/${this.conversationId}/messages/${this.lastMessageId}/stop`,
      {
        method: 'POST',
        headers: getAuthHeaders(),
      }
    ).catch(() => {
      // Best effort
    });
  }

  private async connectToStream(
    messageId: string,
    abortSignal?: AbortSignal
  ): Promise<ReadableStream<UIMessageChunk>> {
    const streamRes = await fetch(
      `/api/conversations/${this.conversationId}/messages/${messageId}/stream`,
      {
        headers: getAuthHeaders(),
        signal: abortSignal,
      }
    );

    if (!streamRes.ok || !streamRes.body) {
      throw new Error(`Stream connection failed: ${streamRes.status}`);
    }

    return this.parser.parseStream(streamRes.body);
  }
}

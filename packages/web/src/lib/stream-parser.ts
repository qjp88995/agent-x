import { DefaultChatTransport, type UIMessage, type UIMessageChunk } from 'ai';

/**
 * Reuses DefaultChatTransport's SSE parsing capability to convert
 * a raw byte stream into UIMessageChunk objects.
 */
export class StreamResponseParser extends DefaultChatTransport<UIMessage> {
  constructor() {
    super({ api: '' });
  }

  parseStream(
    stream: ReadableStream<Uint8Array>
  ): ReadableStream<UIMessageChunk> {
    return this.processResponseStream(stream);
  }
}

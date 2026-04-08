import { useCallback, useEffect, useRef } from 'react';

import type { MessageResponse } from '@agent-x/shared';
import { useChat } from '@ai-sdk/react';
import { useQueryClient } from '@tanstack/react-query';
import { type ChatTransport, type UIMessage } from 'ai';

import { toUIMessages } from '@/lib/message-utils';

/**
 * Extension of ChatTransport<UIMessage> satisfied by both AgentXChatTransport
 * and SharedChatTransport.
 */
interface StreamTransport extends ChatTransport<UIMessage> {
  destroy(): void;
  stopStream(): Promise<void>;
}

interface UseChatStreamOptions {
  conversationId: string;
  transport: StreamTransport | undefined;
  savedMessages: MessageResponse[] | undefined;
  /** React Query cache key for this conversation's messages. Used to clear stale
   *  cache on stream completion so navigation-back always loads fresh data. */
  messagesQueryKey: readonly unknown[];
  /** Whether to attempt SSE reconnection on mount (pass true for authenticated
   *  pages that support resume; defaults to true). */
  resume?: boolean;
}

/**
 * Wraps useChat with full streaming lifecycle management:
 * - Connects/reconnects SSE via the supplied transport
 * - Destroys transport on unmount or conversation switch
 * - Clears messages cache when streaming completes (prevents stale-cache bug
 *   when navigating away and back after a successful stream)
 * - Merges persisted message history into the live chat state
 */
export function useChatStream({
  conversationId,
  transport,
  savedMessages,
  messagesQueryKey,
  resume = true,
}: UseChatStreamOptions) {
  const queryClient = useQueryClient();

  // Ref used by handleStop; kept current via the effect below.
  const transportRef = useRef<StreamTransport | null>(null);
  useEffect(() => {
    transportRef.current = transport ?? null;
  }, [transport]);

  // Destroy the transport whenever it changes (handles conversation switching
  // in components that stay mounted) and on component unmount.
  useEffect(() => {
    const captured = transport ?? null;
    return () => {
      captured?.destroy();
    };
  }, [transport]);

  const { messages, sendMessage, status, setMessages, stop } = useChat({
    id: conversationId,
    transport,
    resume,
  });

  // Refs for cross-effect access without stale closures.
  const statusRef = useRef(status);
  statusRef.current = status;
  const currentMessagesRef = useRef(messages);
  currentMessagesRef.current = messages;
  const messagesQueryKeyRef = useRef(messagesQueryKey);
  messagesQueryKeyRef.current = messagesQueryKey;

  // On unmount: clear messages cache if streaming was still active so the next
  // mount fetches fresh (complete) data rather than the pre-stream snapshot.
  useEffect(() => {
    return () => {
      if (
        statusRef.current === 'streaming' ||
        statusRef.current === 'submitted'
      ) {
        queryClient.removeQueries({ queryKey: messagesQueryKeyRef.current });
      }
    };
  }, [queryClient]);

  // On streaming complete: clear cache so navigating back to this conversation
  // always loads fresh data (the pre-stream cache is missing the AI response).
  const prevStatusRef = useRef(status);
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if ((prev === 'streaming' || prev === 'submitted') && status === 'ready') {
      queryClient.removeQueries({ queryKey: messagesQueryKeyRef.current });
    }
  }, [status, queryClient]);

  // Merge persisted message history into the live useChat state.
  // Preserves any in-flight streaming messages during the merge.
  const historyLoadedRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      savedMessages &&
      savedMessages.length > 0 &&
      historyLoadedRef.current !== conversationId
    ) {
      const history = toUIMessages(
        savedMessages as Parameters<typeof toUIMessages>[0]
      );
      const isStreaming =
        statusRef.current === 'streaming' || statusRef.current === 'submitted';

      if (isStreaming && currentMessagesRef.current.length > 0) {
        const savedIds = new Set(savedMessages.map(m => m.id));
        const streamingMsgs = currentMessagesRef.current.filter(
          m => !savedIds.has(m.id)
        );
        setMessages([...history, ...streamingMsgs]);
      } else {
        setMessages(history);
      }
      historyLoadedRef.current = conversationId;
    }
  }, [savedMessages, conversationId, setMessages]);

  const handleStop = useCallback(() => {
    stop();
    void transportRef.current?.stopStream();
  }, [stop]);

  const isLoading = status === 'submitted' || status === 'streaming';

  return {
    messages,
    sendMessage,
    status,
    setMessages,
    stop,
    handleStop,
    isLoading,
  };
}

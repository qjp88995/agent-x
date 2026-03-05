import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';

import { useChat } from '@ai-sdk/react';
import { type UIMessage } from 'ai';
import { Bot } from 'lucide-react';

import { ChatInput } from '@/components/chat/chat-input';
import { MessageItem } from '@/components/chat/message-item';
import {
  useCreateSharedConversation,
  useSharedAgentInfo,
} from '@/hooks/use-shared-chat';
import { SharedChatTransport } from '@/lib/shared-chat-transport';

import SharedExpiredPage from './expired';

function getStorageKey(token: string) {
  return `shared-chat-${token}`;
}

export default function SharedChatPage() {
  const { token } = useParams<{ token: string }>();
  const { data: agentInfo, isLoading, error } = useSharedAgentInfo(token);
  const createConversation = useCreateSharedConversation();
  const [conversationId, setConversationId] = useState<string | null>(() => {
    if (!token) return null;
    return sessionStorage.getItem(getStorageKey(token));
  });
  const transportRef = useRef<SharedChatTransport | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingMessageRef = useRef<string | null>(null);

  const transport = useMemo(() => {
    if (!token || !conversationId) return undefined;
    const t = new SharedChatTransport(token, conversationId);
    transportRef.current = t;
    return t;
  }, [token, conversationId]);

  const { messages, sendMessage, status, stop } = useChat({
    id: conversationId ?? 'shared-pending',
    transport,
  });

  useEffect(() => {
    return () => {
      transportRef.current?.destroy();
    };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send pending message once transport is ready
  useEffect(() => {
    if (transport && pendingMessageRef.current) {
      const msg = pendingMessageRef.current;
      pendingMessageRef.current = null;
      void sendMessage({ text: msg });
    }
  }, [transport, sendMessage]);

  const isStreaming = status === 'submitted' || status === 'streaming';

  const handleSend = useCallback(
    async (content: string) => {
      if (!token) return;

      if (!conversationId) {
        const conv = await createConversation.mutateAsync({ token });
        setConversationId(conv.id);
        sessionStorage.setItem(getStorageKey(token), conv.id);
        pendingMessageRef.current = content;
        return;
      }

      void sendMessage({ text: content });
    },
    [token, conversationId, createConversation, sendMessage]
  );

  const handleStop = useCallback(() => {
    stop();
    void transportRef.current?.stopStream();
  }, [stop]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (error || !agentInfo) {
    return <SharedExpiredPage />;
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
        <div className="gradient-bg flex size-10 items-center justify-center rounded-full glow-sm">
          {agentInfo.agentAvatar &&
          /^https?:\/\//.test(agentInfo.agentAvatar) ? (
            <img
              src={agentInfo.agentAvatar}
              alt={agentInfo.agentName}
              className="size-10 rounded-full object-cover"
            />
          ) : (
            <Bot className="text-white size-5" />
          )}
        </div>
        <div className="flex-1">
          <h1 className="font-semibold">{agentInfo.agentName}</h1>
          {agentInfo.agentDescription && (
            <p className="text-muted-foreground text-xs">
              {agentInfo.agentDescription}
            </p>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-4">
            <div className="bg-muted flex size-16 items-center justify-center rounded-full">
              <Bot className="text-muted-foreground size-8" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">{agentInfo.agentName}</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Start a conversation by sending a message below.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl py-4">
            {messages.map((message: UIMessage) => (
              <MessageItem key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        isLoading={isStreaming}
      />

      {/* Footer */}
      <div className="border-t py-2 text-center text-xs">
        <span className="text-muted-foreground">Powered by </span>
        <span className="gradient-text font-semibold">Agent-X</span>
      </div>
    </div>
  );
}

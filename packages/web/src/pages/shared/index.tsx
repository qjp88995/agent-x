import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { useChat } from '@ai-sdk/react';
import { Bot } from 'lucide-react';

import { ChatInput } from '@/components/chat/chat-input';
import { MessageList } from '@/components/chat/message-list';
import {
  useCreateSharedConversation,
  useSharedAgentInfo,
  useSharedMessages,
} from '@/hooks/use-shared-chat';
import { toUIMessages } from '@/lib/message-utils';
import { SharedChatTransport } from '@/lib/shared-chat-transport';

import SharedExpiredPage from './expired';

function getStorageKey(token: string) {
  return `shared-chat-${token}`;
}

export default function SharedChatPage() {
  const { t } = useTranslation();
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

  const { messages, sendMessage, status, setMessages, stop } = useChat({
    id: conversationId ?? 'shared-pending',
    transport,
  });

  const { data: savedMessages } = useSharedMessages(
    token,
    conversationId ?? undefined
  );
  const historyLoadedRef = useRef<string | null>(null);

  // Load saved messages when conversation exists
  useEffect(() => {
    if (
      savedMessages &&
      savedMessages.length > 0 &&
      conversationId &&
      historyLoadedRef.current !== conversationId
    ) {
      setMessages(toUIMessages(savedMessages as any));
      historyLoadedRef.current = conversationId;
    }
  }, [savedMessages, conversationId, setMessages]);

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
        <div className="text-muted-foreground text-sm">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (error || !agentInfo) {
    return <SharedExpiredPage />;
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
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
          <div className="flex h-full flex-col items-center justify-center px-4">
            <div className="gradient-bg glow-primary mb-4 flex size-16 items-center justify-center rounded-full">
              <Bot className="size-8 text-white" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">
              {agentInfo.agentName}
            </h3>
            <p className="text-muted-foreground text-sm">
              {t('chat.startConversation')}
            </p>
          </div>
        ) : (
          <MessageList
            ref={messagesEndRef}
            messages={messages}
            className="mx-auto max-w-3xl"
            isStreaming={isStreaming}
            showTyping={
              isStreaming &&
              messages.length > 0 &&
              messages[messages.length - 1].role === 'user'
            }
          />
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
        <span className="text-muted-foreground">{t('common.poweredBy')} </span>
        <span className="gradient-text font-semibold">Agent-X</span>
      </div>
    </div>
  );
}

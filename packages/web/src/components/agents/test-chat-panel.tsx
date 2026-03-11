import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useChat } from '@ai-sdk/react';
import {
  Bot,
  MessageSquarePlus,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';

import { ChatInput } from '@/components/chat/chat-input';
import { MessageList } from '@/components/chat/message-list';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useCreateConversation } from '@/hooks/use-chat';
import { AgentXChatTransport } from '@/lib/chat-transport';
import { cn } from '@/lib/utils';

interface TestChatPanelProps {
  readonly agentId: string;
  readonly className?: string;
}

export function TestChatPanel({ agentId, className }: TestChatPanelProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const createConversation = useCreateConversation();
  const transportRef = useRef<AgentXChatTransport | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () => (conversationId ? new AgentXChatTransport(conversationId) : null),
    [conversationId]
  );

  useEffect(() => {
    transportRef.current = transport;
  }, [transport]);

  const { messages, sendMessage, status, setMessages, stop } = useChat({
    id: conversationId ?? 'test-chat-pending',
    transport: transport ?? undefined,
  });

  useEffect(() => {
    return () => {
      transportRef.current?.destroy();
    };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isLoading = status === 'submitted' || status === 'streaming';

  const handleSend = useCallback(
    async (content: string) => {
      let cid = conversationId;
      if (!cid) {
        const conv = await createConversation.mutateAsync({
          agentId,
          title: 'Test Chat',
        });
        cid = conv.id;
        setConversationId(cid);
        // Wait for next render to get transport
        // sendMessage will be called after state update
      }
      // If we just created the conversation, transport isn't ready yet.
      // We need to defer the send until transport is available.
      if (conversationId) {
        void sendMessage({ text: content });
      } else {
        // Store the pending message and send after transport is ready
        pendingMessageRef.current = content;
      }
    },
    [conversationId, agentId, createConversation, sendMessage]
  );

  const pendingMessageRef = useRef<string | null>(null);

  // Send pending message once transport is ready
  useEffect(() => {
    if (transport && pendingMessageRef.current) {
      const msg = pendingMessageRef.current;
      pendingMessageRef.current = null;
      void sendMessage({ text: msg });
    }
  }, [transport, sendMessage]);

  const handleStop = useCallback(() => {
    stop();
    void transportRef.current?.stopStream();
  }, [stop]);

  function handleNewChat() {
    transportRef.current?.destroy();
    setConversationId(null);
    setMessages([]);
    pendingMessageRef.current = null;
  }

  if (collapsed) {
    return (
      <div
        className={cn('flex flex-col items-center border-l pt-4', className)}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(false)}
            >
              <PanelRightOpen className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('chat.openTestChat')}</TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className={cn('flex w-120 shrink-0 flex-col border-l', className)}>
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-3">
        <span className="text-sm font-medium">{t('chat.testChat')}</span>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleNewChat}>
                <MessageSquarePlus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('chat.newChat')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(true)}
              >
                <PanelRightClose className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('chat.collapse')}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16">
            <div className="bg-muted flex size-12 items-center justify-center rounded-full">
              <Bot className="text-muted-foreground size-6" />
            </div>
            <p className="text-muted-foreground text-center text-sm">
              {t('chat.testAgent')}
            </p>
          </div>
        ) : (
          <MessageList
            ref={messagesEndRef}
            messages={messages}
            isStreaming={isLoading}
            showTyping={
              isLoading &&
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
        isLoading={isLoading}
      />
    </div>
  );
}

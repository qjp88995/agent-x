import { useEffect, useMemo, useRef } from 'react';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { Bot, MessageSquare } from 'lucide-react';

import { useMessages } from '@/hooks/use-chat';

import { ChatInput } from './chat-input';
import { MessageItem } from './message-item';

interface ChatPanelProps {
  readonly conversationId: string;
  readonly agentName: string;
}

function EmptyChat({ agentName }: { readonly agentName: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
      <div className="bg-muted flex size-16 items-center justify-center rounded-full">
        <Bot className="text-muted-foreground size-8" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold">{agentName}</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Start a conversation by sending a message below.
        </p>
      </div>
    </div>
  );
}

export function ChatPanel({ conversationId, agentName }: ChatPanelProps) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/conversations/${conversationId}/chat`,
        headers: () => ({
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        }),
      }),
    [conversationId]
  );

  const { messages, sendMessage, status, setMessages, stop } = useChat({
    id: conversationId,
    transport,
  });

  const isLoading = status === 'submitted' || status === 'streaming';
  const { data: savedMessages } = useMessages(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const historyLoadedRef = useRef<string | null>(null);

  // Load saved messages when conversation changes
  useEffect(() => {
    if (
      savedMessages &&
      savedMessages.length > 0 &&
      historyLoadedRef.current !== conversationId
    ) {
      const history: UIMessage[] = savedMessages.map(msg => ({
        id: msg.id,
        role:
          msg.role.toLowerCase() === 'user'
            ? ('user' as const)
            : ('assistant' as const),
        parts: (msg.parts as Array<{ type: string; text?: string }>).map(p => {
          if (p.type === 'reasoning') {
            return {
              type: 'reasoning' as const,
              text: p.text ?? '',
              state: 'done' as const,
            };
          }
          return {
            type: 'text' as const,
            text: p.text ?? '',
          };
        }),
      }));
      setMessages(history);
      historyLoadedRef.current = conversationId;
    }
  }, [savedMessages, conversationId, setMessages]);

  // Reset history loaded ref when conversation changes
  useEffect(() => {
    if (historyLoadedRef.current !== conversationId) {
      historyLoadedRef.current = null;
    }
  }, [conversationId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (content: string) => {
    void sendMessage({ text: content });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <MessageSquare className="text-muted-foreground size-5" />
        <h2 className="truncate font-semibold">{agentName}</h2>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyChat agentName={agentName} />
        ) : (
          <div className="mx-auto max-w-3xl py-4">
            {messages.map(message => (
              <MessageItem key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} onStop={stop} isLoading={isLoading} />
    </div>
  );
}

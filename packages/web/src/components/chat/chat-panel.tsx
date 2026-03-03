import { useEffect, useRef } from 'react';
import { Bot, MessageSquare } from 'lucide-react';
import { MessageItem } from './message-item';
import { ChatInput } from './chat-input';
import { useChatStream, type ChatMessage } from '@/hooks/use-chat-stream';
import { useMessages } from '@/hooks/use-chat';

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
  const { messages, isLoading, sendMessage, stop, loadHistory } =
    useChatStream(conversationId);
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
      const history: ChatMessage[] = savedMessages.map((msg) => {
        const parts = msg.parts as Array<{ type: string; text?: string }>;
        const textContent = parts
          .filter((p) => p.type === 'text')
          .map((p) => p.text ?? '')
          .join('');

        return {
          id: msg.id,
          role: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
          content: textContent,
        };
      });
      loadHistory(history);
      historyLoadedRef.current = conversationId;
    }
  }, [savedMessages, conversationId, loadHistory]);

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
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        onStop={stop}
        isLoading={isLoading}
      />
    </div>
  );
}

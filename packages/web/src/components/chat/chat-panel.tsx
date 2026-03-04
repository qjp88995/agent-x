import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useChat } from '@ai-sdk/react';
import { useQueryClient } from '@tanstack/react-query';
import { type UIMessage } from 'ai';
import { Bot, MessageSquare } from 'lucide-react';

import { messagesKey, useMessages } from '@/hooks/use-chat';
import { AgentXChatTransport } from '@/lib/chat-transport';

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
  const queryClient = useQueryClient();
  const transportRef = useRef<AgentXChatTransport | null>(null);
  const transport = useMemo(
    () => new AgentXChatTransport(conversationId),
    [conversationId]
  );

  useEffect(() => {
    transportRef.current = transport;
  }, [transport]);

  const { messages, sendMessage, status, setMessages, stop } = useChat({
    id: conversationId,
    transport,
    resume: true,
  });

  const statusRef = useRef(status);
  statusRef.current = status;
  const currentMessagesRef = useRef(messages);
  currentMessagesRef.current = messages;

  // Abort active SSE connection and clear stale cache on unmount
  useEffect(() => {
    return () => {
      transportRef.current?.destroy();
      // When streaming is active, the messages cache is stale (missing the user
      // message that triggered the stream). Remove it so remount fetches fresh data.
      if (
        statusRef.current === 'streaming' ||
        statusRef.current === 'submitted'
      ) {
        queryClient.removeQueries({ queryKey: messagesKey(conversationId) });
      }
    };
  }, [conversationId, queryClient]);

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
      const history: UIMessage[] = savedMessages.map(msg => {
        const rawParts = msg.parts as Array<Record<string, any>>;

        // Index tool-result by toolCallId for pairing
        const resultMap = new Map<string, Record<string, any>>();
        for (const p of rawParts) {
          if (p.type === 'tool-result') {
            resultMap.set(p.toolCallId, p);
          }
        }

        const parts: UIMessage['parts'] = [];
        for (const p of rawParts) {
          if (p.type === 'reasoning') {
            parts.push({
              type: 'reasoning' as const,
              text: p.text ?? '',
              state: 'done' as const,
            });
          } else if (p.type === 'tool-call') {
            const result = resultMap.get(p.toolCallId);
            parts.push({
              type: `tool-${p.toolName}`,
              toolCallId: p.toolCallId,
              toolName: p.toolName,
              state: result ? 'output-available' : 'input-available',
              input: p.args,
              ...(result ? { output: result.result } : {}),
            } as any);
          } else if (p.type === 'tool-result') {
            // Skip - already merged into tool-call above
          } else {
            parts.push({
              type: 'text' as const,
              text: p.text ?? '',
            });
          }
        }

        return {
          id: msg.id,
          role:
            msg.role.toLowerCase() === 'user'
              ? ('user' as const)
              : ('assistant' as const),
          parts,
        };
      });
      // If a resumed stream is active, preserve the streaming message(s)
      const currentStatus = statusRef.current;
      const currentMessages = currentMessagesRef.current;
      const isStreaming =
        currentStatus === 'streaming' || currentStatus === 'submitted';

      if (isStreaming && currentMessages.length > 0) {
        const savedIds = new Set(savedMessages.map(m => m.id));
        const streamingMsgs = currentMessages.filter(m => !savedIds.has(m.id));
        setMessages([...history, ...streamingMsgs]);
      } else {
        setMessages(history);
      }
      historyLoadedRef.current = conversationId;
    }
  }, [savedMessages, conversationId, setMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (content: string) => {
    void sendMessage({ text: content });
  };

  const handleStop = useCallback(() => {
    stop();
    void transportRef.current?.stopStream();
  }, [stop]);

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
      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        isLoading={isLoading}
      />
    </div>
  );
}

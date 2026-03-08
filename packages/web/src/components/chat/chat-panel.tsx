import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useChat } from '@ai-sdk/react';
import { useQueryClient } from '@tanstack/react-query';
import { Bot, Code2, MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { IdeLayout } from '@/components/workspace/ide-layout';
import { messagesKey, useMessages } from '@/hooks/use-chat';
import { useWorkspaceFiles } from '@/hooks/use-workspace';
import { AgentXChatTransport } from '@/lib/chat-transport';
import { toUIMessages } from '@/lib/message-utils';

import { ChatInput } from './chat-input';
import { MessageList } from './message-list';

interface ChatPanelProps {
  readonly conversationId: string;
  readonly agentName: string;
}

function EmptyChat({ agentName }: { readonly agentName: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="gradient-bg glow-primary mb-4 flex size-16 items-center justify-center rounded-full">
        <Bot className="size-8 text-white" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{agentName}</h3>
      <p className="text-muted-foreground text-sm">
        {t('chat.startConversation')}
      </p>
    </div>
  );
}

export function ChatPanel({ conversationId, agentName }: ChatPanelProps) {
  const { t } = useTranslation();
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
      const history = toUIMessages(savedMessages as any);
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

  // IDE view state
  const [ideMode, setIdeMode] = useState(false);
  const { data: workspaceFiles } = useWorkspaceFiles(conversationId);
  const hasFiles = workspaceFiles && workspaceFiles.length > 0;

  if (ideMode) {
    return (
      <IdeLayout
        conversationId={conversationId}
        messages={messages}
        messagesEndRef={messagesEndRef}
        isLoading={isLoading}
        onSend={handleSend}
        onStop={handleStop}
        onBackToChat={() => setIdeMode(false)}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <MessageSquare className="text-primary size-5" />
        <h2 className="truncate font-semibold">{agentName}</h2>
        {hasFiles && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto size-8 cursor-pointer"
                onClick={() => setIdeMode(true)}
              >
                <Code2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('workspace.openIde')}</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyChat agentName={agentName} />
        ) : (
          <MessageList
            ref={messagesEndRef}
            messages={messages}
            className="mx-auto max-w-3xl"
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

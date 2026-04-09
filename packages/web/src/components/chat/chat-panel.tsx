import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@agent-x/design';
import { useQueryClient } from '@tanstack/react-query';
import { Bot, ChevronLeft, Code2, MessageSquare } from 'lucide-react';

import { useAutoScroll } from '@/hooks/use-auto-scroll';
import { CONVERSATIONS_KEY, messagesKey, useMessages } from '@/hooks/use-chat';
import { useChatStream } from '@/hooks/use-chat-stream';
import { useWorkspaceFiles } from '@/hooks/use-workspace';
import { useWorkspaceSync } from '@/hooks/use-workspace-sync';
import { AgentXChatTransport } from '@/lib/chat-transport';

import { ChatInput } from './chat-input';
import { MessageList } from './message-list';

interface ChatPanelProps {
  readonly conversationId: string;
  readonly agentName: string;
  readonly title?: string;
  readonly onBack?: () => void;
  /** Hide the built-in header (use when ChatShell provides the header). */
  readonly hideHeader?: boolean;
}

function EmptyChat({ agentName }: { readonly agentName: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="bg-primary mb-4 flex size-16 items-center justify-center rounded-full">
        <Bot className="size-8 text-white" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{agentName}</h3>
      <p className="text-foreground-muted text-sm">
        {t('chat.startConversation')}
      </p>
    </div>
  );
}

export function ChatPanel({
  conversationId,
  agentName,
  title,
  onBack,
  hideHeader,
}: ChatPanelProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const transport = useMemo(
    () => new AgentXChatTransport(conversationId),
    [conversationId]
  );

  const { data: savedMessages } = useMessages(conversationId);

  const { messages, sendMessage, status, handleStop, isLoading } =
    useChatStream({
      conversationId,
      transport,
      savedMessages,
      messagesQueryKey: messagesKey(conversationId),
    });

  useWorkspaceSync(conversationId, messages);

  const { scrollContainerRef, sentinelRef, handleScroll, scrollToBottom } =
    useAutoScroll(isLoading);

  // Refresh conversation list after streaming completes (for auto-generated title)
  const prevStatusRef = useRef(status);
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if ((prev === 'streaming' || prev === 'submitted') && status === 'ready') {
      const timer = setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, queryClient]);

  const handleSend = useCallback(
    (content: string) => {
      scrollToBottom();
      void sendMessage({ text: content });
    },
    [sendMessage, scrollToBottom]
  );

  const { data: workspaceFiles } = useWorkspaceFiles(conversationId);
  const hasFiles = workspaceFiles && workspaceFiles.length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      {!hideHeader && (
        <div className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="mr-1 size-8 md:hidden"
              onClick={onBack}
              aria-label="返回"
            >
              <ChevronLeft className="size-4" />
            </Button>
          )}
          <MessageSquare className="text-primary size-5" />
          <h2 className="truncate text-sm font-semibold">
            {title ?? agentName}
          </h2>
          {hasFiles && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto size-8"
                  asChild
                >
                  <Link to={`/chat/${conversationId}/workspace`}>
                    <Code2 className="size-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('workspace.openIde')}</TooltipContent>
            </Tooltip>
          )}
        </div>
      )}

      {/* Messages area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex flex-1 flex-col overflow-y-auto"
      >
        {messages.length === 0 ? (
          <EmptyChat agentName={agentName} />
        ) : (
          <MessageList
            ref={sentinelRef}
            messages={messages}
            className="mx-auto max-w-160"
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

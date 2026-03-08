import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';

import { useChat } from '@ai-sdk/react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';

import { ChatInput } from '@/components/chat/chat-input';
import { MessageList } from '@/components/chat/message-list';
import { Button } from '@/components/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { WorkspacePanel } from '@/components/workspace/workspace-panel';
import { messagesKey, useMessages } from '@/hooks/use-chat';
import { useWorkspaceSync } from '@/hooks/use-workspace-sync';
import { AgentXChatTransport } from '@/lib/chat-transport';
import { toUIMessages } from '@/lib/message-utils';

export default function WorkspacePage() {
  const { t } = useTranslation();
  const { conversationId } = useParams<{ conversationId: string }>();
  const queryClient = useQueryClient();
  const transportRef = useRef<AgentXChatTransport | null>(null);

  const transport = useMemo(
    () => (conversationId ? new AgentXChatTransport(conversationId) : null),
    [conversationId]
  );

  useEffect(() => {
    transportRef.current = transport;
  }, [transport]);

  const { messages, sendMessage, status, setMessages, stop } = useChat({
    id: conversationId,
    transport: transport ?? undefined,
    resume: true,
  });

  useWorkspaceSync(conversationId, messages);

  const statusRef = useRef(status);
  statusRef.current = status;
  const currentMessagesRef = useRef(messages);
  currentMessagesRef.current = messages;

  useEffect(() => {
    return () => {
      transportRef.current?.destroy();
      if (
        statusRef.current === 'streaming' ||
        statusRef.current === 'submitted'
      ) {
        queryClient.removeQueries({
          queryKey: messagesKey(conversationId ?? ''),
        });
      }
    };
  }, [conversationId, queryClient]);

  const isLoading = status === 'submitted' || status === 'streaming';
  const { data: savedMessages } = useMessages(conversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const historyLoadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      savedMessages &&
      savedMessages.length > 0 &&
      conversationId &&
      historyLoadedRef.current !== conversationId
    ) {
      const history = toUIMessages(savedMessages as any);
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

  if (!conversationId) return null;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <div className="flex h-10 shrink-0 items-center gap-2 border-b px-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 cursor-pointer"
              asChild
            >
              <Link to={`/chat?conversation=${conversationId}`}>
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('workspace.backToChat')}</TooltipContent>
        </Tooltip>
        <span className="gradient-text text-sm font-semibold">
          {t('workspace.title')}
        </span>
      </div>

      {/* Content */}
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        {/* Workspace panel (file tree + editor) */}
        <ResizablePanel defaultSize="60%" minSize="30%">
          <WorkspacePanel conversationId={conversationId} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Chat panel */}
        <ResizablePanel defaultSize="40%" minSize="20%">
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto">
              <MessageList
                ref={messagesEndRef}
                messages={messages}
                className="mx-auto max-w-full px-2"
                isStreaming={isLoading}
                showTyping={
                  isLoading &&
                  messages.length > 0 &&
                  messages[messages.length - 1].role === 'user'
                }
              />
            </div>
            <ChatInput
              onSend={handleSend}
              onStop={handleStop}
              isLoading={isLoading}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

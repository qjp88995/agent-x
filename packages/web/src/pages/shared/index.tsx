import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router';

import { useChat } from '@ai-sdk/react';
import { useQueryClient } from '@tanstack/react-query';
import { Bot, Code2, MessageSquare, Plus } from 'lucide-react';

import { ChatInput } from '@/components/chat/chat-input';
import { MessageList } from '@/components/chat/message-list';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  sharedConversationsKey,
  useCreateSharedConversation,
  useSharedAgentInfo,
  useSharedConversations,
  useSharedMessages,
  useSharedWorkspaceFiles,
} from '@/hooks/use-shared-chat';
import { useWorkspaceSync } from '@/hooks/use-workspace-sync';
import { toUIMessages } from '@/lib/message-utils';
import { SharedChatTransport } from '@/lib/shared-chat-transport';
import { cn } from '@/lib/utils';

import SharedExpiredPage from './expired';

function SharedChatContent({
  token,
  agentInfo,
}: {
  readonly token: string;
  readonly agentInfo: {
    agentName: string;
    agentDescription: string | null;
    agentAvatar: string | null;
  };
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: conversations } = useSharedConversations(token);
  const createConversation = useCreateSharedConversation();

  const [searchParams, setSearchParams] = useSearchParams();
  const conversationId = searchParams.get('c');

  const setConversationId = useCallback(
    (id: string | null) => {
      setSearchParams(id ? { c: id } : {}, { replace: true });
    },
    [setSearchParams]
  );

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

  useWorkspaceSync(conversationId ?? undefined, messages);

  const { data: workspaceFiles } = useSharedWorkspaceFiles(
    token,
    conversationId ?? undefined
  );
  const hasFiles = workspaceFiles && workspaceFiles.length > 0;

  const { data: savedMessages } = useSharedMessages(
    token,
    conversationId ?? undefined
  );
  const historyLoadedRef = useRef<string | null>(null);

  // Load saved messages when conversation changes
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

  // Refresh conversation list after streaming completes (for auto-generated title)
  const prevStatusRef = useRef(status);
  useEffect(() => {
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (
      (prev === 'streaming' || prev === 'submitted') &&
      status === 'ready' &&
      token
    ) {
      const timer = setTimeout(() => {
        void queryClient.invalidateQueries({
          queryKey: sharedConversationsKey(token),
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, queryClient, token]);

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
        pendingMessageRef.current = content;
        return;
      }

      void sendMessage({ text: content });
    },
    [token, conversationId, createConversation, sendMessage, setConversationId]
  );

  const handleStop = useCallback(() => {
    stop();
    void transportRef.current?.stopStream();
  }, [stop]);

  const handleNewChat = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    historyLoadedRef.current = null;
  }, [setConversationId, setMessages]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      if (id === conversationId) return;
      transportRef.current?.destroy();
      setConversationId(id);
      historyLoadedRef.current = null;
      setMessages([]);
    },
    [conversationId, setConversationId, setMessages]
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="flex h-full w-72 flex-col border-r bg-background">
        {/* Agent info */}
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b px-4">
          <div className="gradient-bg flex size-8 shrink-0 items-center justify-center rounded-full">
            {agentInfo.agentAvatar &&
            /^https?:\/\//.test(agentInfo.agentAvatar) ? (
              <img
                src={agentInfo.agentAvatar}
                alt={agentInfo.agentName}
                className="size-8 rounded-full object-cover"
              />
            ) : (
              <Bot className="size-4 text-white" />
            )}
          </div>
          <span className="truncate text-sm font-semibold">
            {agentInfo.agentName}
          </span>
        </div>

        {/* New chat button */}
        <div className="px-3 py-2">
          <Button
            variant="primary"
            className="w-full"
            size="sm"
            onClick={handleNewChat}
          >
            <Plus className="mr-2 size-4" />
            {t('chat.newChat')}
          </Button>
        </div>

        <Separator />

        {/* Conversation list */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-1 p-2">
            {(!conversations || conversations.length === 0) && (
              <div className="flex flex-col items-center justify-center py-8">
                <MessageSquare className="text-muted-foreground mb-2 size-8 opacity-40" />
                <p className="text-muted-foreground text-xs">
                  {t('chat.noConversationsYet')}
                </p>
              </div>
            )}
            {conversations?.map(conv => (
              <button
                key={conv.id}
                type="button"
                onClick={() => handleSelectConversation(conv.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                  conv.id === conversationId
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50 text-foreground/80'
                )}
              >
                <MessageSquare className="mt-0.5 size-4 shrink-0 opacity-60" />
                <p className="min-w-0 flex-1 truncate text-sm font-medium">
                  {conv.title ?? t('chat.newChat')}
                </p>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <Separator />
        <div className="py-2 text-center text-xs">
          <span className="text-muted-foreground">
            {t('common.poweredBy')}{' '}
          </span>
          <span className="gradient-text font-semibold">Agent-X</span>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
          <MessageSquare className="text-primary size-5" />
          <h2 className="truncate font-semibold">
            {conversationId
              ? (conversations?.find(c => c.id === conversationId)?.title ??
                t('chat.newChat'))
              : agentInfo.agentName}
          </h2>
          {conversationId && hasFiles && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto size-8"
                  asChild
                >
                  <Link to={`/s/${token}/workspace/${conversationId}`}>
                    <Code2 className="size-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('workspace.openIde')}</TooltipContent>
            </Tooltip>
          )}
        </div>

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
      </div>
    </div>
  );
}

export default function SharedChatPage() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const { data: agentInfo, isLoading, error } = useSharedAgentInfo(token);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (error || !agentInfo || !token) {
    return <SharedExpiredPage />;
  }

  return <SharedChatContent token={token} agentInfo={agentInfo} />;
}

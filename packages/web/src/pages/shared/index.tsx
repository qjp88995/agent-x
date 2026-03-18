import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router';

import {
  Button,
  LoadingState,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@agent-x/design';
import { useChat } from '@ai-sdk/react';
import { useQueryClient } from '@tanstack/react-query';
import { Bot, Code2, MessageSquare, Plus } from 'lucide-react';

import { ChatInput } from '@/components/chat/chat-input';
import { ChatShell } from '@/components/chat/chat-shell';
import { MessageList } from '@/components/chat/message-list';
import { SharedWelcome } from '@/components/chat/shared-welcome';
import {
  sharedConversationsKey,
  useCreateSharedConversation,
  useDeleteSharedConversation,
  useRenameSharedConversation,
  useSharedAgentInfo,
  useSharedConversations,
  useSharedMessages,
  useSharedWorkspaceFiles,
} from '@/hooks/use-shared-chat';
import { useWorkspaceSync } from '@/hooks/use-workspace-sync';
import type { ChatConversation } from '@/lib/chat-types';
import { toUIMessages } from '@/lib/message-utils';
import { SharedChatTransport } from '@/lib/shared-chat-transport';

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
  const deleteConversation = useDeleteSharedConversation();
  const renameConversation = useRenameSharedConversation();

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

  const handleRenameConversation = useCallback(
    (id: string, title: string) => {
      renameConversation.mutate({ token, id, title });
    },
    [renameConversation, token]
  );

  const handleDeleteConversation = useCallback(
    (id: string) => {
      deleteConversation.mutate(
        { token, id },
        {
          onSuccess: () => {
            if (conversationId === id) {
              setConversationId(null);
              setMessages([]);
              historyLoadedRef.current = null;
            }
          },
        }
      );
    },
    [deleteConversation, token, conversationId, setConversationId, setMessages]
  );

  const mappedConversations: ChatConversation[] = useMemo(
    () =>
      (conversations ?? []).map(c => ({
        id: c.id,
        title: c.title,
        updatedAt: c.updatedAt,
      })),
    [conversations]
  );

  return (
    <ChatShell
      sidebarHeader={
        <>
          <div className="bg-primary flex size-8 shrink-0 items-center justify-center rounded-full">
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
        </>
      }
      sidebarActions={
        <Button
          variant="primary"
          className="w-full"
          size="sm"
          onClick={handleNewChat}
        >
          <Plus className="mr-2 size-4" />
          {t('chat.newChat')}
        </Button>
      }
      sidebarFooter={
        <>
          <span className="text-foreground-muted">
            {t('common.poweredBy')}{' '}
          </span>
          <span className="text-primary font-semibold">Agent-X</span>
        </>
      }
      conversations={mappedConversations}
      activeConversationId={conversationId}
      onSelectConversation={handleSelectConversation}
      onDeleteConversation={handleDeleteConversation}
      onRenameConversation={handleRenameConversation}
      chatHeader={
        <>
          <MessageSquare className="text-primary size-5" />
          <h2 className="truncate text-sm font-semibold">
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
        </>
      }
    >
      {messages.length === 0 ? (
        <SharedWelcome
          agentName={agentInfo.agentName}
          agentDescription={agentInfo.agentDescription}
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <MessageList
            ref={messagesEndRef}
            messages={messages}
            className="mx-auto max-w-160"
            isStreaming={isStreaming}
            showTyping={
              isStreaming &&
              messages.length > 0 &&
              messages[messages.length - 1].role === 'user'
            }
          />
        </div>
      )}
      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        isLoading={isStreaming}
      />
    </ChatShell>
  );
}

export default function SharedChatPage() {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const { data: agentInfo, isLoading, error } = useSharedAgentInfo(token);

  if (isLoading) {
    return (
      <LoadingState message={t('common.loading')} className="min-h-screen" />
    );
  }

  if (error || !agentInfo || !token) {
    return <SharedExpiredPage />;
  }

  return <SharedChatContent token={token} agentInfo={agentInfo} />;
}

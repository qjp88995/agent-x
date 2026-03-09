import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router';

import type { SharedConversationResponse } from '@agent-x/shared';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare } from 'lucide-react';

import { MessageList } from '@/components/chat/message-list';
import { LoadingState, NotFoundState, PageHeader } from '@/components/shared';
import { useAgentVersions } from '@/hooks/use-agent-versions';
import { useAgent } from '@/hooks/use-agents';
import { useDateLocale } from '@/hooks/use-date-locale';
import {
  useSharedConversationMessages,
  useSharedConversations,
} from '@/hooks/use-shared-conversations';
import { toUIMessages } from '@/lib/message-utils';
import { cn } from '@/lib/utils';

function ConversationMessages({
  agentId,
  conversationId,
}: {
  agentId: string;
  conversationId: string;
}) {
  const { t } = useTranslation();
  const { data: messages, isLoading } = useSharedConversationMessages(
    agentId,
    conversationId
  );

  const uiMessages = useMemo(
    () => (messages ? toUIMessages(messages) : []),
    [messages]
  );

  if (isLoading) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
        {t('conversations.loadingMessages')}
      </div>
    );
  }

  if (!uiMessages.length) {
    return (
      <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
        {t('conversations.noMessages')}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <MessageList messages={uiMessages} />
    </div>
  );
}

function ConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: SharedConversationResponse[];
  selectedId: string | null;
  onSelect: (conv: SharedConversationResponse) => void;
}) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  if (!conversations.length) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 p-4">
        <MessageSquare className="text-muted-foreground/50 size-8" />
        <p className="text-sm">{t('conversations.noConversations')}</p>
        <p className="text-xs">{t('conversations.noConversationsDesc')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {conversations.map(conv => (
        <button
          key={conv.id}
          type="button"
          className={cn(
            'flex flex-col gap-1 border-b px-4 py-3 text-left transition-colors',
            'hover:bg-muted/50 cursor-pointer',
            selectedId === conv.id && 'bg-muted/70'
          )}
          onClick={() => onSelect(conv)}
        >
          <span className="line-clamp-1 text-sm font-medium">
            {conv.title ?? t('conversations.untitled')}
          </span>
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            {conv.shareToken && <span>via {conv.shareToken.name}</span>}
            <span>
              {formatDistanceToNow(new Date(conv.updatedAt), {
                addSuffix: true,
                locale: dateLocale,
              })}
            </span>
            <span className="ml-auto flex items-center gap-1">
              <MessageSquare className="size-3" />
              {conv._count.messages}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function VersionConversationsPage() {
  const { t } = useTranslation();
  const { id, versionId } = useParams<{ id: string; versionId: string }>();
  const { data: agent, isLoading: isLoadingAgent, error } = useAgent(id);
  const { data: versions } = useAgentVersions(id);
  const { data: allConversations, isLoading: isLoadingConversations } =
    useSharedConversations(id);

  const [selectedConv, setSelectedConv] =
    useState<SharedConversationResponse | null>(null);

  const version = useMemo(
    () => versions?.find(v => v.id === versionId),
    [versions, versionId]
  );

  const conversations = useMemo(
    () => allConversations?.filter(c => c.agentVersionId === versionId) ?? [],
    [allConversations, versionId]
  );

  if (!id || !versionId) {
    return <Navigate to="/agents" replace />;
  }

  if (isLoadingAgent) {
    return <LoadingState message={t('agents.loadingAgent')} />;
  }

  if (error || !agent) {
    return (
      <NotFoundState
        title={t('agents.notFound')}
        description={t('agents.notFoundDesc')}
        backLabel={t('agents.backToAgents')}
        backTo="/agents"
      />
    );
  }

  return (
    <div className="-m-6 flex min-h-0 flex-1 flex-col">
      <div className="p-6 pb-0">
        <PageHeader
          backTo={-1}
          backLabel={t('common.back')}
          title={t('conversations.title')}
          description={t('conversations.pageDesc', {
            name: agent.name,
            version: version?.version ?? '?',
          })}
        />
      </div>

      <div className="mt-6 flex min-h-0 flex-1 border-t">
        {/* Left: conversation list */}
        <div className="flex w-80 shrink-0 flex-col overflow-y-auto border-r">
          {isLoadingConversations ? (
            <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
              {t('common.loading')}
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              selectedId={selectedConv?.id ?? null}
              onSelect={setSelectedConv}
            />
          )}
        </div>

        {/* Right: conversation messages */}
        <div className="flex min-w-0 flex-1 flex-col">
          {selectedConv ? (
            <ConversationMessages
              agentId={id}
              conversationId={selectedConv.id}
            />
          ) : (
            <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
              {t('conversations.selectConversation')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

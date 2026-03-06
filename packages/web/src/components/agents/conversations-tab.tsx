import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { SharedConversationResponse } from '@agent-x/shared';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, MessageSquare } from 'lucide-react';

import { MessageList } from '@/components/chat/message-list';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDateLocale } from '@/hooks/use-date-locale';
import {
  useSharedConversationMessages,
  useSharedConversations,
} from '@/hooks/use-shared-conversations';
import { toUIMessages } from '@/lib/message-utils';

interface ConversationsTabProps {
  agentId: string;
}

function ConversationDetail({
  agentId,
  conversation,
  onBack,
}: {
  agentId: string;
  conversation: SharedConversationResponse;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const { data: messages, isLoading } = useSharedConversationMessages(
    agentId,
    conversation.id
  );

  const uiMessages = useMemo(
    () => (messages ? toUIMessages(messages) : []),
    [messages]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('common.back')}</TooltipContent>
        </Tooltip>
        <div>
          <h3 className="text-sm font-medium">
            {conversation.title ?? t('conversations.untitled')}
          </h3>
          <p className="text-muted-foreground text-xs">
            {conversation.shareToken?.name && (
              <span>via {conversation.shareToken.name} · </span>
            )}
            {conversation.agentVersion && (
              <span>v{conversation.agentVersion.version} · </span>
            )}
            {formatDistanceToNow(new Date(conversation.updatedAt), {
              addSuffix: true,
              locale: dateLocale,
            })}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground py-8 text-center text-sm">
          {t('conversations.loadingMessages')}
        </div>
      ) : !uiMessages.length ? (
        <div className="text-muted-foreground py-8 text-center text-sm">
          {t('conversations.noMessages')}
        </div>
      ) : (
        <MessageList messages={uiMessages} />
      )}
    </div>
  );
}

export function ConversationsTab({ agentId }: ConversationsTabProps) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const { data: conversations, isLoading } = useSharedConversations(agentId);
  const [selectedConversation, setSelectedConversation] =
    useState<SharedConversationResponse | null>(null);

  if (isLoading) {
    return (
      <Card className="max-w-4xl">
        <CardContent className="py-8">
          <div className="text-muted-foreground text-center text-sm">
            {t('common.loading')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>{t('conversations.title')}</CardTitle>
        <CardDescription>{t('conversations.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        {selectedConversation ? (
          <ConversationDetail
            agentId={agentId}
            conversation={selectedConversation}
            onBack={() => setSelectedConversation(null)}
          />
        ) : !conversations?.length ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              {t('conversations.noConversations')}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {t('conversations.noConversationsDesc')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {conversations.map(conv => (
              <button
                key={conv.id}
                type="button"
                className="hover:bg-muted/50 flex items-center justify-between rounded-md border px-4 py-3 text-left transition-colors"
                onClick={() => setSelectedConversation(conv)}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    {conv.title ?? t('conversations.untitled')}
                  </span>
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    {conv.agentVersion && (
                      <span>v{conv.agentVersion.version}</span>
                    )}
                    {conv.shareToken && <span>via {conv.shareToken.name}</span>}
                    <span>
                      {formatDistanceToNow(new Date(conv.updatedAt), {
                        addSuffix: true,
                        locale: dateLocale,
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-muted-foreground flex items-center gap-1 text-sm">
                  <MessageSquare className="size-3.5" />
                  <span>{conv._count.messages}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

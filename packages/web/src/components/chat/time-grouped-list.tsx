import { useTranslation } from 'react-i18next';

import { StaggerItem, StaggerList } from '@agent-x/design';
import { MessageSquare } from 'lucide-react';

import type { ChatConversation } from '@/lib/chat-types';
import { groupByTime, type TimeGroup } from '@/lib/date-utils';

import { ConversationItem } from './conversation-item';

const GROUP_I18N: Record<TimeGroup, string> = {
  today: 'chat.today',
  yesterday: 'chat.yesterday',
  thisWeek: 'chat.thisWeek',
  earlier: 'chat.earlier',
};

interface TimeGroupedListProps {
  readonly conversations: readonly ChatConversation[];
  readonly activeConversationId: string | null;
  readonly onSelect: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onRename: (id: string, title: string) => void;
}

export function TimeGroupedList({
  conversations,
  activeConversationId,
  onSelect,
  onDelete,
  onRename,
}: TimeGroupedListProps) {
  const { t } = useTranslation();
  const groups = groupByTime(conversations, c => new Date(c.updatedAt));

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <MessageSquare className="text-foreground-muted mb-2 size-8 opacity-40" />
        <p className="text-foreground-muted text-xs">
          {t('chat.noConversationsYet')}
        </p>
      </div>
    );
  }

  return (
    <StaggerList className="flex flex-col gap-0.5">
      {groups.map(({ group, items }) => (
        <div key={group}>
          <div className="text-foreground-muted px-2 py-1 text-xs font-semibold uppercase tracking-wide">
            {t(GROUP_I18N[group])}
          </div>
          {items.map(conv => (
            <StaggerItem key={conv.id}>
              <ConversationItem
                conversation={conv}
                isActive={conv.id === activeConversationId}
                onSelect={() => onSelect(conv.id)}
                onDelete={() => onDelete(conv.id)}
                onRename={title => onRename(conv.id, title)}
              />
            </StaggerItem>
          ))}
        </div>
      ))}
    </StaggerList>
  );
}

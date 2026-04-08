import { Separator } from '@agent-x/design';

import type { ChatConversation } from '@/lib/chat-types';

import { TimeGroupedList } from './time-grouped-list';

interface ChatSidebarProps {
  /** Top area: back button + title (chat) or agent info (shared) */
  readonly header: React.ReactNode;
  /** Actions below header: agent selector + new chat button */
  readonly actions?: React.ReactNode;
  /** Bottom: branding footer (shared) */
  readonly footer?: React.ReactNode;
  readonly conversations: readonly ChatConversation[];
  readonly activeConversationId: string | null;
  readonly onSelectConversation: (id: string) => void;
  readonly onDeleteConversation: (id: string) => void;
  readonly onRenameConversation: (id: string, title: string) => void;
}

export function ChatSidebar({
  header,
  actions,
  footer,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
}: ChatSidebarProps) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden border-r bg-background md:w-(--chat-sidebar)">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
        {header}
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex flex-col gap-2 px-3 py-2">{actions}</div>
      )}

      <Separator />

      {/* Conversation list */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <TimeGroupedList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelect={onSelectConversation}
          onDelete={onDeleteConversation}
          onRename={onRenameConversation}
        />
      </div>

      {/* Footer */}
      {footer && (
        <div className="border-t border-border py-2 text-center text-xs">
          {footer}
        </div>
      )}
    </div>
  );
}

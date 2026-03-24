import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from '@agent-x/design';
import type { Locale } from 'date-fns';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { MessageSquare, Pencil, Trash2 } from 'lucide-react';

import { useDateLocale } from '@/hooks/use-date-locale';
import type { ChatConversation } from '@/lib/chat-types';
import { cn } from '@/lib/utils';

function formatDate(dateString: string, locale: Locale): string {
  const date = new Date(dateString);
  if (isToday(date)) return format(date, 'HH:mm', { locale });
  if (isYesterday(date))
    return formatDistanceToNow(date, { addSuffix: true, locale });
  return format(date, 'MMM d', { locale });
}

interface ConversationItemProps {
  readonly conversation: ChatConversation;
  readonly isActive: boolean;
  readonly onSelect: () => void;
  readonly onDelete: () => void;
  readonly onRename: (title: string) => void;
}

export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: ConversationItemProps) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(conversation.title ?? '');
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleConfirm = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== conversation.title) {
      onRename(trimmed);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm();
    else if (e.key === 'Escape') setIsEditing(false);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') onSelect();
      }}
      className={cn(
        'group flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
        isActive
          ? 'bg-card text-foreground-secondary'
          : 'hover:bg-card/50 text-foreground/80'
      )}
    >
      <MessageSquare className="size-4 shrink-0 opacity-60" />
      <div className="min-w-0 flex-1">
        {isEditing ? (
          <input
            ref={inputRef}
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onBlur={handleConfirm}
            onKeyDown={handleKeyDown}
            onClick={e => e.stopPropagation()}
            className="bg-background w-full rounded border px-1.5 py-0.5 text-sm font-medium outline-none focus:ring-1 focus:ring-ring"
          />
        ) : (
          <p className="truncate text-sm font-medium">
            {conversation.title ?? t('chat.newChat')}
          </p>
        )}
        <p className="text-foreground-muted mt-0.5 truncate text-xs">
          {conversation.agentName && <>{conversation.agentName} &middot; </>}
          {formatDate(conversation.updatedAt, dateLocale)}
        </p>
      </div>
      {!isEditing && (
        <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
          <Button
            variant="ghost"
            size="icon"
            className="size-5"
            onClick={handleStartEdit}
            aria-label={t('chat.renameConversation')}
          >
            <Pencil className="size-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-5 hover:text-destructive"
                onClick={e => e.stopPropagation()}
                aria-label={t('chat.deleteConversation')}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent variant="destructive">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('chat.confirmDeleteConversation')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('chat.confirmDeleteConversationDesc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>
                  {t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}

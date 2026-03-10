import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';

import type { Locale } from 'date-fns';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  ChevronDown,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

import { ChatPanel } from '@/components/chat/chat-panel';
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAgents } from '@/hooks/use-agents';
import {
  type ConversationWithAgent,
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useRenameConversation,
} from '@/hooks/use-chat';
import { useDateLocale } from '@/hooks/use-date-locale';
import { cn } from '@/lib/utils';

function formatDate(dateString: string, locale: Locale): string {
  const date = new Date(dateString);

  if (isToday(date)) {
    return format(date, 'HH:mm', { locale });
  }
  if (isYesterday(date)) {
    return formatDistanceToNow(date, { addSuffix: true, locale });
  }
  return format(date, 'MMM d', { locale });
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: {
  readonly conversation: ConversationWithAgent;
  readonly isActive: boolean;
  readonly onSelect: () => void;
  readonly onDelete: () => void;
  readonly onRename: (title: string) => void;
}) {
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
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'hover:bg-accent/50 text-foreground/80'
      )}
    >
      <MessageSquare className="mt-0.5 size-4 shrink-0 opacity-60" />
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
        <p className="text-muted-foreground mt-0.5 truncate text-xs">
          {conversation.agent.name} &middot;{' '}
          {formatDate(conversation.updatedAt, dateLocale)}
        </p>
      </div>
      {!isEditing && (
        <div className="mt-0.5 hidden shrink-0 items-center gap-0.5 group-hover:flex">
          <button
            type="button"
            onClick={handleStartEdit}
            className="text-muted-foreground hover:text-foreground rounded p-0.5"
            aria-label={t('chat.renameConversation')}
          >
            <Pencil className="size-3.5" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                onClick={e => e.stopPropagation()}
                className="text-muted-foreground hover:text-destructive rounded p-0.5"
                aria-label={t('chat.deleteConversation')}
              >
                <Trash2 className="size-3.5" />
              </button>
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
    </button>
  );
}

function Sidebar({
  conversations,
  activeConversationId,
  selectedAgentId,
  agents,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onNewChat,
  onSelectAgent,
}: {
  readonly conversations: ConversationWithAgent[];
  readonly activeConversationId: string | null;
  readonly selectedAgentId: string | null;
  readonly agents: Array<{
    readonly id: string;
    readonly name: string;
    readonly status: string;
  }>;
  readonly onSelectConversation: (id: string) => void;
  readonly onDeleteConversation: (id: string) => void;
  readonly onRenameConversation: (id: string, title: string) => void;
  readonly onNewChat: () => void;
  readonly onSelectAgent: (id: string) => void;
}) {
  const { t } = useTranslation();
  const publishedAgents = agents.filter(a => a.status === 'ACTIVE');
  const selectedAgent = publishedAgents.find(a => a.id === selectedAgentId);
  const filteredConversations = selectedAgentId
    ? conversations.filter(c => c.agentId === selectedAgentId)
    : conversations;

  return (
    <div className="flex h-full w-72 flex-col border-r bg-background">
      {/* Back to dashboard + title */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" asChild>
              <Link to="/agents">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('chat.backToDashboard')}</TooltipContent>
        </Tooltip>
        <span className="gradient-text text-lg font-bold tracking-tight">
          {t('chat.title')}
        </span>
      </div>

      {/* Agent selector */}
      <div className="px-3 pt-3 pb-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              size="sm"
            >
              <span className="flex items-center gap-2 truncate">
                <Bot className="size-4 shrink-0" />
                <span className="truncate">
                  {selectedAgent?.name ?? t('chat.allAgents')}
                </span>
              </span>
              <ChevronDown className="size-3.5 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="start">
            <DropdownMenuItem onClick={() => onSelectAgent('')}>
              {t('chat.allAgents')}
            </DropdownMenuItem>
            {publishedAgents.map(agent => (
              <DropdownMenuItem
                key={agent.id}
                onClick={() => onSelectAgent(agent.id)}
                className="cursor-pointer"
              >
                {agent.name}
              </DropdownMenuItem>
            ))}
            {publishedAgents.length === 0 && (
              <div className="text-muted-foreground px-2 py-1.5 text-sm">
                {t('chat.noAgentsAvailable')}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* New chat button */}
      <div className="px-3 pb-2">
        <Button
          variant="primary"
          className="w-full"
          size="sm"
          onClick={onNewChat}
          disabled={!selectedAgentId}
        >
          <Plus className="mr-2 size-4" />
          {t('chat.newChat')}
        </Button>
      </div>

      <Separator />

      {/* Conversation list */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-1 p-2">
          {filteredConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8">
              <MessageSquare className="text-muted-foreground mb-2 size-8 opacity-40" />
              <p className="text-muted-foreground text-xs">
                {selectedAgentId
                  ? t('chat.noConversationsYet')
                  : t('chat.selectAgentToStart')}
              </p>
            </div>
          )}
          {filteredConversations.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              onSelect={() => onSelectConversation(conv.id)}
              onDelete={() => onDeleteConversation(conv.id)}
              onRename={title => onRenameConversation(conv.id, title)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function NoChatSelected() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="gradient-bg glow-primary mb-4 flex size-16 items-center justify-center rounded-full">
        <MessageSquare className="size-8 text-white" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">
        {t('chat.selectConversation')}
      </h3>
      <p className="text-muted-foreground text-sm">
        {t('chat.chooseConversation')}
      </p>
    </div>
  );
}

export default function ChatPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const agentParam = searchParams.get('agent');
  const conversationParam = searchParams.get('conversation');

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
    agentParam
  );
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(conversationParam);

  const {
    data: conversations,
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useConversations();
  const { data: agents } = useAgents();
  const createConversation = useCreateConversation();
  const renameConversation = useRenameConversation();
  const deleteConversation = useDeleteConversation();

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedAgentId) params.set('agent', selectedAgentId);
    if (activeConversationId) params.set('conversation', activeConversationId);
    setSearchParams(params, { replace: true });
  }, [selectedAgentId, activeConversationId, setSearchParams]);

  const handleSelectAgent = useCallback((agentId: string) => {
    setSelectedAgentId(agentId || null);
    setActiveConversationId(null);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const handleRenameConversation = useCallback(
    (id: string, title: string) => {
      renameConversation.mutate({ id, title });
    },
    [renameConversation]
  );

  const handleDeleteConversation = useCallback(
    (id: string) => {
      deleteConversation.mutate(id, {
        onSuccess: () => {
          if (activeConversationId === id) {
            setActiveConversationId(null);
          }
        },
      });
    },
    [deleteConversation, activeConversationId]
  );

  const handleNewChat = useCallback(() => {
    if (!selectedAgentId) return;

    createConversation.mutate(
      { agentId: selectedAgentId },
      {
        onSuccess: data => {
          setActiveConversationId(data.id);
        },
      }
    );
  }, [selectedAgentId, createConversation]);

  // Find the active conversation's agent name
  const activeConversation = conversations?.find(
    c => c.id === activeConversationId
  );
  const agentName = activeConversation?.agent.name ?? 'Assistant';

  if (conversationsError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <AlertTriangle className="text-destructive size-10" />
          <p className="text-muted-foreground">
            {t('chat.failedToLoadConversations')}
          </p>
          <Button variant="outline" asChild>
            <Link to="/agents">{t('chat.backToDashboard')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations ?? []}
        activeConversationId={activeConversationId}
        selectedAgentId={selectedAgentId}
        agents={agents ?? []}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onNewChat={handleNewChat}
        onSelectAgent={handleSelectAgent}
      />

      {/* Main chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {conversationsLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground text-sm">
              {t('common.loading')}
            </p>
          </div>
        ) : activeConversationId ? (
          <ChatPanel
            key={activeConversationId}
            conversationId={activeConversationId}
            agentName={agentName}
            title={activeConversation?.title ?? undefined}
          />
        ) : (
          <NoChatSelected />
        )}
      </div>
    </div>
  );
}

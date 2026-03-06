import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type {
  AgentResponse,
  AgentStatus as AgentStatusType,
} from '@agent-x/shared';
import { AgentStatus } from '@agent-x/shared';
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  Bot,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAgents,
  useArchiveAgent,
  useDeleteAgent,
  useUnarchiveAgent,
} from '@/hooks/use-agents';
import { cn } from '@/lib/utils';

const STATUS_BADGE_CONFIG: Record<
  AgentStatusType,
  { labelKey: string; className: string }
> = {
  ACTIVE: {
    labelKey: 'agents.active',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  ARCHIVED: {
    labelKey: 'agents.archived',
    className:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  },
};

type FilterTab = 'all' | AgentStatusType;

function StatusBadge({ status }: { readonly status: AgentStatusType }) {
  const { t } = useTranslation();
  const config = STATUS_BADGE_CONFIG[status];
  return (
    <Badge variant="outline" className={cn('border-0', config.className)}>
      {t(config.labelKey)}
    </Badge>
  );
}

function getAgentInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function AgentCard({
  agent,
  onDelete,
  onArchive,
  onUnarchive,
}: {
  readonly agent: AgentResponse;
  readonly onDelete: (agent: AgentResponse) => void;
  readonly onArchive: (agent: AgentResponse) => void;
  readonly onUnarchive: (agent: AgentResponse) => void;
}) {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback className="gradient-bg text-white text-sm font-semibold">
              {getAgentInitial(agent.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">{agent.name}</CardTitle>
            <div className="flex items-center gap-2">
              <StatusBadge status={agent.status} />
              {agent.latestVersion !== null && (
                <span className="text-muted-foreground text-xs">
                  v{agent.latestVersion}
                </span>
              )}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">{t('common.actions')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/agents/${agent.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                {t('common.edit')}
              </Link>
            </DropdownMenuItem>
            {agent.status === AgentStatus.ACTIVE && (
              <>
                <DropdownMenuItem asChild>
                  <Link to={`/chat?agent=${agent.id}`}>
                    <MessageSquare className="mr-2 size-4" />
                    {t('agents.chat')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onArchive(agent)}>
                  <Archive className="mr-2 size-4" />
                  {t('agents.archive')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(agent)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </>
            )}
            {agent.status === AgentStatus.ARCHIVED && (
              <DropdownMenuItem onClick={() => onUnarchive(agent)}>
                <ArchiveRestore className="mr-2 size-4" />
                {t('agents.unarchive')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="flex-1">
        {agent.description ? (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {agent.description}
          </p>
        ) : (
          <p className="text-muted-foreground/50 text-sm italic">
            {t('common.noDescription')}
          </p>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="text-muted-foreground text-xs">{agent.modelId}</div>
      </CardFooter>
    </Card>
  );
}

function EmptyState({ filter }: { readonly filter: FilterTab }) {
  const { t } = useTranslation();
  const message =
    filter === 'all'
      ? t('agents.noAgentsDesc')
      : t('agents.noFilteredAgents', { filter: filter.toLowerCase() });

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="gradient-bg text-white flex size-16 items-center justify-center rounded-full mb-4">
        <Bot className="size-8" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{t('agents.noAgents')}</h3>
      <p className="text-muted-foreground mb-6 text-sm">{message}</p>
      {filter === 'all' && (
        <Button
          asChild
          className="gradient-bg text-white hover:opacity-90 cursor-pointer"
        >
          <Link to="/agents/new">
            <Plus className="mr-2 size-4" />
            {t('agents.createAgent')}
          </Link>
        </Button>
      )}
    </div>
  );
}

export default function AgentListPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const statusFilter =
    activeTab === 'all' ? undefined : (activeTab as AgentStatusType);
  const { data: agents, isLoading, error } = useAgents(statusFilter);
  const deleteAgent = useDeleteAgent();
  const archiveAgent = useArchiveAgent();
  const unarchiveAgent = useUnarchiveAgent();
  const [deleteTarget, setDeleteTarget] = useState<AgentResponse | null>(null);

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteAgent.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success(t('agents.deleted'));
      },
    });
  }

  function handleArchive(agent: AgentResponse) {
    archiveAgent.mutate(agent.id, {
      onSuccess: () => {
        toast.success(t('agents.archived'));
      },
    });
  }

  function handleUnarchive(agent: AgentResponse) {
    unarchiveAgent.mutate(agent.id, {
      onSuccess: () => {
        toast.success(t('agents.unarchived'));
      },
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground text-sm">
          {t('agents.loadingAgents')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">
          {t('common.failedToLoad', {
            resource: t('agents.title').toLowerCase(),
          })}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t('common.tryRefreshing')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('agents.title')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('agents.subtitle')}
          </p>
        </div>
        <Button
          asChild
          className="gradient-bg text-white hover:opacity-90 cursor-pointer"
        >
          <Link to="/agents/new">
            <Plus className="mr-2 size-4" />
            {t('agents.createAgent')}
          </Link>
        </Button>
      </div>

      {/* Filter tabs */}
      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as FilterTab)}
      >
        <TabsList>
          <TabsTrigger value="all">{t('agents.all')}</TabsTrigger>
          <TabsTrigger value={AgentStatus.ACTIVE}>
            {t('agents.active')}
          </TabsTrigger>
          <TabsTrigger value={AgentStatus.ARCHIVED}>
            {t('agents.archived')}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Agent grid or empty state */}
      {!agents || agents.length === 0 ? (
        <EmptyState filter={activeTab} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onDelete={setDeleteTarget}
              onArchive={handleArchive}
              onUnarchive={handleUnarchive}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('agents.deleteAgent')}</DialogTitle>
            <DialogDescription>
              {t('agents.deleteConfirm', { name: deleteTarget?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('common.cancel')}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteAgent.isPending}
            >
              {deleteAgent.isPending
                ? t('common.deleting')
                : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

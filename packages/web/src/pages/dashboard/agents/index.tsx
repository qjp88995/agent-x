import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@agent-x/design';
import type {
  AgentResponse,
  AgentStatus as AgentStatusType,
} from '@agent-x/shared';
import { AgentStatus } from '@agent-x/shared';
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  GitBranch,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { AgentEmptyState } from '@/components/agents/agent-empty-state';
import { AddCard } from '@/components/shared/add-card';
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
          <Avatar name={agent.name} size="lg" />
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
            {agent.status === AgentStatus.ACTIVE && (
              <>
                <DropdownMenuItem onClick={() => onArchive(agent)}>
                  <Archive className="mr-2 size-4" />
                  {t('agents.archive')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(agent)}
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
        <div className="flex w-full items-center justify-between">
          <div className="text-muted-foreground text-xs">{agent.modelId}</div>
          <div className="flex items-center gap-1">
            {agent.status === AgentStatus.ACTIVE && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    asChild
                  >
                    <Link to={`/chat?agent=${agent.id}`}>
                      <MessageSquare className="size-3.5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('agents.chat')}</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7" asChild>
                  <Link to={`/agents/${agent.id}/versions`}>
                    <GitBranch className="size-3.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('agents.versionManagement')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7" asChild>
                  <Link to={`/agents/${agent.id}/edit`}>
                    <Pencil className="size-3.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('common.edit')}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function AgentListPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const { data: allAgents, isLoading, error } = useAgents();

  const agents = useMemo(
    () =>
      activeTab === 'all'
        ? allAgents
        : allAgents?.filter(a => a.status === activeTab),
    [allAgents, activeTab]
  );
  const deleteAgent = useDeleteAgent();
  const archiveAgent = useArchiveAgent();
  const unarchiveAgent = useUnarchiveAgent();
  const [deleteTarget, setDeleteTarget] = useState<AgentResponse | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<AgentResponse | null>(
    null
  );

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteAgent.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success(t('agents.deleted'));
      },
    });
  }

  function handleArchiveConfirm() {
    if (!archiveTarget) return;
    archiveAgent.mutate(archiveTarget.id, {
      onSuccess: () => {
        setArchiveTarget(null);
        toast.success(t('agents.archiveSuccess'));
      },
    });
  }

  function handleUnarchive(agent: AgentResponse) {
    unarchiveAgent.mutate(agent.id, {
      onSuccess: () => {
        toast.success(t('agents.unarchiveSuccess'));
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

      {/* Agent grid */}
      {!agents?.length ? (
        <AgentEmptyState />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AddCard to="/agents/new" label={t('agents.createAgent')} />
          {agents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onDelete={setDeleteTarget}
              onArchive={setArchiveTarget}
              onUnarchive={handleUnarchive}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent variant="destructive">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('agents.deleteAgent')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('agents.deleteConfirm', { name: deleteTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteAgent.isPending}
            >
              {deleteAgent.isPending
                ? t('common.deleting')
                : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive confirmation dialog */}
      <AlertDialog
        open={archiveTarget !== null}
        onOpenChange={open => {
          if (!open) setArchiveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('agents.archiveAgent')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('agents.archiveConfirm', { name: archiveTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveConfirm}
              disabled={archiveAgent.isPending}
            >
              {t('agents.archive')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

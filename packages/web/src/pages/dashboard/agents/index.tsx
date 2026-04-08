import { useState } from 'react';
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
  type FilterTab,
  FilterTabs,
  PageHeader,
  Skeleton,
  StaggerItem,
  StaggerList,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  ViewToggle,
} from '@agent-x/design';
import type { AgentResponse } from '@agent-x/shared';
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
import {
  useAgents,
  useArchiveAgent,
  useDeleteAgent,
  useUnarchiveAgent,
} from '@/hooks/use-agents';
import { FILTER_ALL, useFilteredSearch } from '@/hooks/use-filtered-search';
import { useViewMode } from '@/hooks/use-view-mode';

import { AgentTable } from './agent-table';

function AgentCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-md" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-1.5 h-4 w-2/3" />
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="flex w-full items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <div className="flex items-center gap-1">
            <Skeleton className="size-7 rounded-md" />
            <Skeleton className="size-7 rounded-md" />
            <Skeleton className="size-7 rounded-md" />
          </div>
        </div>
      </CardFooter>
    </Card>
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
              <Badge
                variant={
                  agent.status === AgentStatus.ACTIVE ? 'success' : 'muted'
                }
              >
                {agent.status === AgentStatus.ACTIVE
                  ? t('agents.active')
                  : t('agents.archived')}
              </Badge>
              {agent.latestVersion !== null && (
                <span className="text-foreground-muted text-xs">
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
          <p className="text-foreground-muted line-clamp-2 text-sm">
            {agent.description}
          </p>
        ) : (
          <p className="text-foreground-muted/50 text-sm italic">
            {t('common.noDescription')}
          </p>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="flex w-full items-center justify-between">
          <div className="text-foreground-muted text-xs">{agent.modelId}</div>
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
  const { data: allAgents, isLoading, error } = useAgents();
  const [view, setView] = useViewMode('agents');

  const { filter, setFilter, filtered } = useFilteredSearch(allAgents, {
    searchKeys: ['name', 'description', 'modelId'],
    filterKey: 'status',
  });

  const activeCount = allAgents?.filter(
    a => a.status === AgentStatus.ACTIVE
  ).length;
  const archivedCount = allAgents?.filter(
    a => a.status === AgentStatus.ARCHIVED
  ).length;

  const filterTabs: FilterTab[] = [
    { key: FILTER_ALL, label: t('agents.all'), count: allAgents?.length },
    {
      key: AgentStatus.ACTIVE,
      label: t('agents.active'),
      count: activeCount,
    },
    {
      key: AgentStatus.ARCHIVED,
      label: t('agents.archived'),
      count: archivedCount,
    },
  ];

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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">
          {t('common.failedToLoad', {
            resource: t('agents.title').toLowerCase(),
          })}
        </h3>
        <p className="text-foreground-muted text-sm">
          {t('common.tryRefreshing')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <PageHeader
        title={t('agents.title')}
        description={t('agents.subtitle')}
        search
        actions={
          <Button variant="primary" asChild>
            <Link to="/agents/new">{t('agents.createAgent')}</Link>
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-5">
        <FilterTabs tabs={filterTabs} value={filter} onChange={setFilter} />
        <ViewToggle value={view} onChange={setView} />
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          view === 'table' ? (
            <AgentTable
              agents={[]}
              onDelete={setDeleteTarget}
              onArchive={setArchiveTarget}
              onUnarchive={handleUnarchive}
              loading
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <AgentCardSkeleton key={i} />
              ))}
            </div>
          )
        ) : !filtered.length ? (
          <AgentEmptyState />
        ) : view === 'table' ? (
          <AgentTable
            agents={filtered}
            onDelete={setDeleteTarget}
            onArchive={setArchiveTarget}
            onUnarchive={handleUnarchive}
          />
        ) : (
          <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(agent => (
              <StaggerItem key={agent.id}>
                <AgentCard
                  agent={agent}
                  onDelete={setDeleteTarget}
                  onArchive={setArchiveTarget}
                  onUnarchive={handleUnarchive}
                />
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </div>

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

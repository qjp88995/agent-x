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
  Button,
  type FilterTab,
  FilterTabs,
  PageHeader,
} from '@agent-x/design';
import type { AgentResponse } from '@agent-x/shared';
import { AgentStatus } from '@agent-x/shared';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { AgentEmptyState } from '@/components/agents/agent-empty-state';
import {
  useAgents,
  useArchiveAgent,
  useDeleteAgent,
  useUnarchiveAgent,
} from '@/hooks/use-agents';
import { FILTER_ALL, useFilteredSearch } from '@/hooks/use-filtered-search';

import { AgentTable } from './agent-table';

export default function AgentListPage() {
  const { t } = useTranslation();
  const { data: allAgents, isLoading, error } = useAgents();

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
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          <AgentTable
            agents={[]}
            onDelete={setDeleteTarget}
            onArchive={setArchiveTarget}
            onUnarchive={handleUnarchive}
            loading
          />
        ) : !filtered.length ? (
          <AgentEmptyState />
        ) : (
          <AgentTable
            agents={filtered}
            onDelete={setDeleteTarget}
            onArchive={setArchiveTarget}
            onUnarchive={handleUnarchive}
          />
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

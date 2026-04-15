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
import type { ProviderResponse } from '@agent-x/shared';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { ProviderEmptyState } from '@/components/providers/provider-empty-state';
import { FILTER_ALL, useFilteredSearch } from '@/hooks/use-filtered-search';
import { useDeleteProvider, useProviders } from '@/hooks/use-providers';

import { ProviderTable } from './provider-table';

export default function ProviderListPage() {
  const { t } = useTranslation();
  const { data: allProviders, isLoading, error } = useProviders();
  const deleteProvider = useDeleteProvider();
  const [deleteTarget, setDeleteTarget] = useState<ProviderResponse | null>(
    null
  );

  const { filter, setFilter, filtered } = useFilteredSearch(allProviders, {
    searchKeys: ['name'],
    filterKey: 'isActive',
  });

  const activeCount = allProviders?.filter(p => p.isActive).length;
  const inactiveCount = allProviders?.filter(p => !p.isActive).length;

  const filterTabs: FilterTab[] = [
    {
      key: FILTER_ALL,
      label: t('agents.all', { defaultValue: 'All' }),
      count: allProviders?.length,
    },
    {
      key: 'true',
      label: t('common.active'),
      count: activeCount,
    },
    {
      key: 'false',
      label: t('common.inactive'),
      count: inactiveCount,
    },
  ];

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteProvider.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success(t('providers.deleted'));
      },
    });
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">
          {t('common.failedToLoad', {
            resource: t('providers.title').toLowerCase(),
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
        title={t('providers.title')}
        description={t('providers.subtitle')}
        search
        actions={
          <Button variant="primary" asChild>
            <Link to="/providers/new">{t('providers.addProvider')}</Link>
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-5">
        <FilterTabs tabs={filterTabs} value={filter} onChange={setFilter} />
      </div>

      {/* Provider list */}
      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          <ProviderTable providers={[]} onDelete={setDeleteTarget} loading />
        ) : !filtered.length ? (
          <ProviderEmptyState />
        ) : (
          <ProviderTable providers={filtered} onDelete={setDeleteTarget} />
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
            <AlertDialogTitle>{t('providers.deleteProvider')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('providers.deleteConfirm', { name: deleteTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteProvider.isPending}
            >
              {deleteProvider.isPending
                ? t('common.deleting')
                : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

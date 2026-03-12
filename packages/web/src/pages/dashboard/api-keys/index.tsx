import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Button,
  type FilterTab,
  FilterTabs,
  PageHeader,
} from '@agent-x/design';
import { AlertTriangle, Key, Plus } from 'lucide-react';

import { CreateKeyDialog } from '@/components/api-keys/create-key-dialog';
import { DeleteConfirmDialog } from '@/components/api-keys/delete-confirm-dialog';
import { UsageDocs } from '@/components/api-keys/usage-docs';
import { useApiKeys } from '@/hooks/use-api-keys';
import { FILTER_ALL, useFilteredSearch } from '@/hooks/use-filtered-search';

import { ApiKeyTable } from './api-key-table';
import type { ApiKeyWithStatus } from './types';
import { withStatus } from './types';

function EmptyState({ onCreateClick }: { readonly onCreateClick: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary text-white">
        <Key className="size-8" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{t('apiKeys.noKeys')}</h3>
      <p className="text-foreground-muted mb-6 text-sm">
        {t('apiKeys.noKeysDesc')}
      </p>
      <Button onClick={onCreateClick} variant="primary">
        <Plus className="mr-2 size-4" />
        {t('apiKeys.createKey')}
      </Button>
    </div>
  );
}

export default function ApiKeysPage() {
  const { t } = useTranslation();
  const { data: rawApiKeys, isLoading, error } = useApiKeys();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyWithStatus | null>(
    null
  );

  const apiKeysWithStatus = useMemo(
    () => (rawApiKeys ? withStatus(rawApiKeys) : undefined),
    [rawApiKeys]
  );

  const { filter, setFilter, filtered } = useFilteredSearch(apiKeysWithStatus, {
    searchKeys: ['name'],
    filterKey: 'status',
  });

  const activeCount = apiKeysWithStatus?.filter(
    k => k.status === 'active'
  ).length;
  const revokedCount = apiKeysWithStatus?.filter(
    k => k.status === 'revoked'
  ).length;
  const expiredCount = apiKeysWithStatus?.filter(
    k => k.status === 'expired'
  ).length;

  const filterTabs: FilterTab[] = [
    {
      key: FILTER_ALL,
      label: t('agents.all', { defaultValue: 'All' }),
      count: apiKeysWithStatus?.length,
    },
    {
      key: 'active',
      label: t('common.active'),
      count: activeCount,
    },
    {
      key: 'revoked',
      label: t('apiKeys.revoked'),
      count: revokedCount,
    },
    {
      key: 'expired',
      label: t('apiKeys.expired'),
      count: expiredCount,
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">
          {t('common.failedToLoad', { resource: t('apiKeys.title') })}
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
        title={t('apiKeys.title')}
        search
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            {t('apiKeys.createKey')}
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-5">
        <FilterTabs tabs={filterTabs} value={filter} onChange={setFilter} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          <ApiKeyTable apiKeys={[]} onRevoke={setDeleteTarget} loading />
        ) : !filtered.length && filter === FILTER_ALL ? (
          <EmptyState onCreateClick={() => setCreateOpen(true)} />
        ) : (
          <ApiKeyTable apiKeys={filtered} onRevoke={setDeleteTarget} />
        )}

        {/* Usage docs - show below table when there are keys */}
        {!isLoading && (apiKeysWithStatus?.length ?? 0) > 0 && (
          <div className="mt-5">
            <UsageDocs />
          </div>
        )}
      </div>

      <CreateKeyDialog open={createOpen} onOpenChange={setCreateOpen} />

      <DeleteConfirmDialog
        target={deleteTarget}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
}

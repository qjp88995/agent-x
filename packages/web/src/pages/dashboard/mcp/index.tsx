import { useMemo, useState } from 'react';
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
  type FilterTab,
  FilterTabs,
  PageHeader,
  StaggerItem,
  StaggerList,
  ViewToggle,
} from '@agent-x/design';
import type { McpServerResponse } from '@agent-x/shared';
import { McpType } from '@agent-x/shared';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { MarketplaceCard } from '@/components/mcp/marketplace-card';
import { McpEmptyState } from '@/components/mcp/mcp-empty-state';
import { McpServerCard } from '@/components/mcp/mcp-server-card';
import { AddCard } from '@/components/shared/add-card';
import { useIsAdmin } from '@/hooks/use-auth';
import { FILTER_ALL, useFilteredSearch } from '@/hooks/use-filtered-search';
import {
  useDeleteMarketplaceMcpServer,
  useDeleteMcpServer,
  useMcpMarket,
  useMcpServers,
} from '@/hooks/use-mcp';
import { useViewMode } from '@/hooks/use-view-mode';

import { McpTable } from './mcp-table';

export default function McpPage() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const [view, setView] = useViewMode('mcp');

  const {
    data: marketServers,
    isLoading: isLoadingMarket,
    error: marketError,
  } = useMcpMarket();
  const {
    data: customServers,
    isLoading: isLoadingCustom,
    error: customError,
  } = useMcpServers();

  const deleteMcpServer = useDeleteMcpServer();
  const deleteMarketplaceMcpServer = useDeleteMarketplaceMcpServer();
  const [deleteTarget, setDeleteTarget] = useState<McpServerResponse | null>(
    null
  );
  const [deleteMode, setDeleteMode] = useState<'custom' | 'marketplace'>(
    'custom'
  );

  const isLoading = isLoadingMarket || isLoadingCustom;
  const error = marketError ?? customError;
  const isDeleting =
    deleteMcpServer.isPending || deleteMarketplaceMcpServer.isPending;

  const allServers = useMemo(
    () => [...(marketServers ?? []), ...(customServers ?? [])],
    [marketServers, customServers]
  );

  const { filter, setFilter, filtered } = useFilteredSearch<McpServerResponse>(
    allServers,
    {
      searchKeys: ['name', 'description'],
      filterKey: 'type',
    }
  );

  const officialCount = allServers.filter(
    s => s.type === McpType.OFFICIAL
  ).length;
  const customCount = allServers.filter(s => s.type === McpType.CUSTOM).length;

  const filterTabs: FilterTab[] = [
    {
      key: FILTER_ALL,
      label: t('mcp.all', { defaultValue: 'All' }),
      count: allServers.length,
    },
    {
      key: McpType.OFFICIAL,
      label: t('mcp.marketplace'),
      count: officialCount,
    },
    { key: McpType.CUSTOM, label: t('mcp.myServers'), count: customCount },
  ];

  function handleDeleteCustom(server: McpServerResponse) {
    setDeleteTarget(server);
    setDeleteMode('custom');
  }

  function handleDeleteMarketplace(server: McpServerResponse) {
    setDeleteTarget(server);
    setDeleteMode('marketplace');
  }

  function handleDelete(server: McpServerResponse) {
    if (server.type === McpType.OFFICIAL) {
      handleDeleteMarketplace(server);
    } else {
      handleDeleteCustom(server);
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const mutation =
      deleteMode === 'marketplace'
        ? deleteMarketplaceMcpServer
        : deleteMcpServer;
    mutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success(t('mcp.deleted'));
      },
    });
  }

  const showMarketplaceAddCard =
    isAdmin && (filter === FILTER_ALL || filter === McpType.OFFICIAL);
  const showCustomAddCard = filter === FILTER_ALL || filter === McpType.CUSTOM;

  const emptyTab =
    filter === McpType.OFFICIAL
      ? 'marketplace'
      : filter === McpType.CUSTOM
        ? 'custom'
        : 'marketplace';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-foreground-muted text-sm">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">
          {t('common.failedToLoad', { resource: t('nav.mcpServers') })}
        </h3>
        <p className="text-foreground-muted text-sm">
          {t('common.tryRefreshing')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('mcp.title')}
        description={t('mcp.subtitle')}
        search
        actions={<ViewToggle value={view} onChange={setView} />}
      />

      <FilterTabs
        tabs={filterTabs}
        value={filter}
        onChange={setFilter}
        className="px-1"
      />

      {!filtered.length ? (
        <McpEmptyState tab={emptyTab} isAdmin={isAdmin} />
      ) : view === 'table' ? (
        <McpTable
          servers={filtered}
          isAdmin={isAdmin}
          onDelete={handleDelete}
        />
      ) : (
        <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {showMarketplaceAddCard && (
            <StaggerItem>
              <AddCard
                to="/mcp-servers/new?type=official"
                label={t('mcp.addToMarketplace')}
              />
            </StaggerItem>
          )}
          {showCustomAddCard && (
            <StaggerItem>
              <AddCard to="/mcp-servers/new" label={t('mcp.addServer')} />
            </StaggerItem>
          )}
          {filtered.map(server => (
            <StaggerItem key={server.id}>
              {server.type === McpType.OFFICIAL ? (
                <MarketplaceCard
                  server={server}
                  isAdmin={isAdmin}
                  onDelete={handleDeleteMarketplace}
                />
              ) : (
                <McpServerCard server={server} onDelete={handleDeleteCustom} />
              )}
            </StaggerItem>
          ))}
        </StaggerList>
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent variant="destructive">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteMode === 'marketplace'
                ? t('mcp.deleteMarketplace')
                : t('mcp.deleteServer')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteMode === 'marketplace'
                ? t('mcp.deleteMarketplaceConfirm', {
                    name: deleteTarget?.name,
                  })
                : t('mcp.deleteConfirm', { name: deleteTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

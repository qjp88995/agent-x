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
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  type FilterTab,
  FilterTabs,
  StaggerItem,
  StaggerList,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  ViewToggle,
} from '@agent-x/design';
import type { ProviderProtocol, ProviderResponse } from '@agent-x/shared';
import {
  AlertTriangle,
  ExternalLink,
  Pencil,
  PlugZap,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { ProviderEmptyState } from '@/components/providers/provider-empty-state';
import { AddCard } from '@/components/shared/add-card';
import { ListPageHeader } from '@/components/shared/list-page-header';
import { FILTER_ALL, useFilteredSearch } from '@/hooks/use-filtered-search';
import {
  useDeleteProvider,
  useProviders,
  useSyncModels,
  useTestProvider,
} from '@/hooks/use-providers';
import { useViewMode } from '@/hooks/use-view-mode';
import { PROTOCOL_CONFIG } from '@/lib/provider-constants';
import { cn } from '@/lib/utils';

import { ProviderTable } from './provider-table';

function ProtocolBadge({ protocol }: { readonly protocol: ProviderProtocol }) {
  const { t } = useTranslation();
  const config = PROTOCOL_CONFIG[protocol];
  return (
    <Badge variant="outline" className={cn('border-0', config.className)}>
      {t(config.labelKey)}
    </Badge>
  );
}

function StatusDot({ active }: { readonly active: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          'inline-block size-2 rounded-full',
          active ? 'bg-green-500' : 'bg-gray-400'
        )}
      />
      <span className="text-foreground-muted text-xs">
        {active ? t('common.active') : t('common.inactive')}
      </span>
    </div>
  );
}

function truncateUrl(url: string, maxLength = 40): string {
  if (url.length <= maxLength) return url;
  return `${url.slice(0, maxLength)}...`;
}

function ProviderCard({
  provider,
  onDelete,
}: {
  readonly provider: ProviderResponse;
  readonly onDelete: (provider: ProviderResponse) => void;
}) {
  const { t } = useTranslation();
  const testProvider = useTestProvider();
  const syncModels = useSyncModels();

  function handleTest() {
    testProvider.mutate(provider.id, {
      onSuccess: result => {
        if (result.success) {
          toast.success(t('providers.testSuccess'));
        } else {
          toast.error(t('providers.testFailed'));
        }
      },
      onError: () => {
        toast.error(t('providers.testFailed'));
      },
    });
  }

  function handleSync() {
    syncModels.mutate(provider.id, {
      onSuccess: result => {
        toast.success(t('providers.syncSuccess', { count: result.synced }));
      },
      onError: () => {
        toast.error(t('providers.syncFailed'));
      },
    });
  }

  return (
    <Card className="flex flex-col hover:shadow-md hover:border-primary/20 transition-all duration-200">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base">{provider.name}</CardTitle>
          <div className="flex items-center gap-2">
            <ProtocolBadge protocol={provider.protocol} />
            <StatusDot active={provider.isActive} />
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost-destructive"
              size="icon"
              className="size-8"
              onClick={() => onDelete(provider)}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">{t('common.delete')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('common.delete')}</TooltipContent>
        </Tooltip>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="text-foreground-muted flex items-center gap-1.5 text-sm">
          <ExternalLink className="size-3.5 shrink-0" />
          <span className="truncate">{truncateUrl(provider.baseUrl)}</span>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="flex w-full items-center justify-between">
          <div className="text-foreground-muted text-sm">
            {t('providers.modelCount', { count: provider.models.length })}
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={handleSync}
                  disabled={syncModels.isPending}
                >
                  <RefreshCw
                    className={cn(
                      'size-3.5',
                      syncModels.isPending && 'animate-spin'
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {syncModels.isPending
                  ? t('providers.syncing')
                  : t('providers.syncModels')}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={handleTest}
                  disabled={testProvider.isPending}
                >
                  <PlugZap className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {testProvider.isPending
                  ? t('providers.testing')
                  : t('providers.testConnection')}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7" asChild>
                  <Link to={`/providers/${provider.id}/edit`}>
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

export default function ProviderListPage() {
  const { t } = useTranslation();
  const { data: allProviders, isLoading, error } = useProviders();
  const [view, setView] = useViewMode('providers');
  const deleteProvider = useDeleteProvider();
  const [deleteTarget, setDeleteTarget] = useState<ProviderResponse | null>(
    null
  );

  const { search, setSearch, filter, setFilter, filtered } = useFilteredSearch(
    allProviders,
    {
      searchKeys: ['name'],
      filterKey: 'isActive',
    }
  );

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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <ListPageHeader
        title={t('providers.title')}
        subtitle={t('providers.subtitle')}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: t('providers.searchPlaceholder', {
            defaultValue: 'Search providers...',
          }),
        }}
        trailing={
          <>
            <ViewToggle value={view} onChange={setView} />
            <Button asChild>
              <Link to="/providers/new">{t('providers.addProvider')}</Link>
            </Button>
          </>
        }
      />

      {/* Filter tabs */}
      <FilterTabs
        tabs={filterTabs}
        value={filter}
        onChange={setFilter}
        className="px-1"
      />

      {/* Provider list */}
      {!filtered.length ? (
        <ProviderEmptyState />
      ) : view === 'table' ? (
        <ProviderTable providers={filtered} onDelete={setDeleteTarget} />
      ) : (
        <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StaggerItem>
            <AddCard to="/providers/new" label={t('providers.addProvider')} />
          </StaggerItem>
          {filtered.map(provider => (
            <StaggerItem key={provider.id}>
              <ProviderCard provider={provider} onDelete={setDeleteTarget} />
            </StaggerItem>
          ))}
        </StaggerList>
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

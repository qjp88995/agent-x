import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import {
  Avatar,
  Badge,
  Button,
  type Column,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@agent-x/design';
import type { ProviderResponse } from '@agent-x/shared';
import {
  MoreHorizontal,
  Pencil,
  PlugZap,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSyncModels, useTestProvider } from '@/hooks/use-providers';
import { PROTOCOL_CONFIG } from '@/lib/provider-constants';
import { cn } from '@/lib/utils';

function truncateUrl(url: string, maxLength = 30): string {
  if (url.length <= maxLength) return url;
  return `${url.slice(0, maxLength)}...`;
}

interface ProviderTableProps {
  readonly providers: ProviderResponse[];
  readonly onDelete: (provider: ProviderResponse) => void;
  readonly loading?: boolean;
}

export function ProviderTable({
  providers,
  onDelete,
  loading,
}: ProviderTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const testProvider = useTestProvider();
  const syncModels = useSyncModels();

  function handleTest(provider: ProviderResponse) {
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

  function handleSync(provider: ProviderResponse) {
    syncModels.mutate(provider.id, {
      onSuccess: result => {
        toast.success(t('providers.syncSuccess', { count: result.synced }));
      },
      onError: () => {
        toast.error(t('providers.syncFailed'));
      },
    });
  }

  const columns: Column<ProviderResponse>[] = [
    {
      key: 'name',
      header: t('common.name'),
      render: provider => (
        <div className="flex items-center gap-2.5">
          <Avatar name={provider.name} size="md" />
          <div>
            <div className="text-sm font-medium text-foreground">
              {provider.name}
            </div>
            <div className="text-xs text-foreground-ghost">
              {truncateUrl(provider.baseUrl)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'protocol',
      header: t('providers.protocol', { defaultValue: 'Protocol' }),
      width: '140px',
      hideOnMobile: true,
      render: provider => {
        const config = PROTOCOL_CONFIG[provider.protocol];
        return (
          <Badge variant="outline" className={cn('border-0', config.className)}>
            {t(config.labelKey)}
          </Badge>
        );
      },
    },
    {
      key: 'models',
      header: t('providers.models', { defaultValue: 'Models' }),
      width: '100px',
      hideOnMobile: true,
      render: provider => (
        <span className="text-sm text-foreground-muted">
          {t('providers.modelCount', { count: provider.models.length })}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      width: '120px',
      hideOnMobile: true,
      render: provider => (
        <Badge variant={provider.isActive ? 'success' : 'muted'}>
          {provider.isActive ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
  ];

  function rowActions(provider: ProviderResponse) {
    return (
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={e => {
                e.stopPropagation();
                handleTest(provider);
              }}
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
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={e => {
                e.stopPropagation();
                navigate(`/providers/${provider.id}/edit`);
              }}
            >
              <Pencil className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('common.edit')}</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={e => e.stopPropagation()}
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">{t('common.actions')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleSync(provider)}
              disabled={syncModels.isPending}
            >
              <RefreshCw
                className={cn(
                  'mr-2 size-4',
                  syncModels.isPending && 'animate-spin'
                )}
              />
              {syncModels.isPending
                ? t('providers.syncing')
                : t('providers.syncModels')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(provider)}
            >
              <Trash2 className="mr-2 size-4" />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <DataTable<ProviderResponse>
      columns={columns}
      data={providers}
      keyExtractor={provider => provider.id}
      onRowClick={provider => navigate(`/providers/${provider.id}/edit`)}
      rowActions={rowActions}
      loading={loading}
      emptyState={
        <span>
          {t('providers.noProviders', { defaultValue: 'No providers found.' })}
        </span>
      }
    />
  );
}

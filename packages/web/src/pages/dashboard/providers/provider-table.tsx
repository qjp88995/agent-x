import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import {
  Badge,
  Button,
  type Column,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@agent-x/design';
import type { ProviderProtocol, ProviderResponse } from '@agent-x/shared';
import {
  ExternalLink,
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

interface ProviderTableProps {
  readonly providers: ProviderResponse[];
  readonly onDelete: (provider: ProviderResponse) => void;
}

export function ProviderTable({ providers, onDelete }: ProviderTableProps) {
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
        <span className="text-foreground text-sm font-medium">
          {provider.name}
        </span>
      ),
    },
    {
      key: 'protocol',
      header: t('providers.protocol', { defaultValue: 'Protocol' }),
      width: '140px',
      render: provider => <ProtocolBadge protocol={provider.protocol} />,
    },
    {
      key: 'baseUrl',
      header: t('providers.baseUrl', { defaultValue: 'Base URL' }),
      width: '240px',
      render: provider => (
        <div className="flex items-center gap-1.5 text-sm text-foreground-muted">
          <ExternalLink className="size-3.5 shrink-0" />
          <span className="truncate">{truncateUrl(provider.baseUrl)}</span>
        </div>
      ),
    },
    {
      key: 'models',
      header: t('providers.models', { defaultValue: 'Models' }),
      width: '100px',
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
      render: provider => <StatusDot active={provider.isActive} />,
    },
  ];

  function rowActions(provider: ProviderResponse) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">{t('common.actions')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => handleTest(provider)}
            disabled={testProvider.isPending}
          >
            <PlugZap className="mr-2 size-4" />
            {testProvider.isPending
              ? t('providers.testing')
              : t('providers.testConnection')}
          </DropdownMenuItem>
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
            onClick={() => navigate(`/providers/${provider.id}/edit`)}
          >
            <Pencil className="mr-2 size-4" />
            {t('common.edit')}
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
    );
  }

  return (
    <DataTable<ProviderResponse>
      columns={columns}
      data={providers}
      keyExtractor={provider => provider.id}
      onRowClick={provider => navigate(`/providers/${provider.id}/edit`)}
      rowActions={rowActions}
      emptyState={
        <span>
          {t('providers.noProviders', { defaultValue: 'No providers found.' })}
        </span>
      }
    />
  );
}

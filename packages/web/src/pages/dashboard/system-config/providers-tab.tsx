import { useState } from 'react';
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
  Badge,
  Button,
  type Column,
  DataTable,
  EmptyState,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@agent-x/design';
import type { SystemProviderResponse } from '@agent-x/shared';
import {
  AlertTriangle,
  Loader2,
  Pencil,
  Plug,
  PlugZap,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useDeleteSystemProvider,
  useSystemProviders,
  useTestSystemProvider,
} from '@/hooks/use-system-config';
import { PROTOCOL_CONFIG } from '@/lib/provider-constants';
import { cn } from '@/lib/utils';

import { ProviderFormDialog } from './provider-form-dialog';

function ProviderActions({
  provider,
  onEdit,
  onDelete,
}: {
  readonly provider: SystemProviderResponse;
  readonly onEdit: (provider: SystemProviderResponse) => void;
  readonly onDelete: (provider: SystemProviderResponse) => void;
}) {
  const { t } = useTranslation();
  const testProvider = useTestSystemProvider();

  function handleTest() {
    testProvider.mutate(provider.id, {
      onSuccess: result => {
        if (result.success) {
          toast.success(t('systemConfig.testSuccess'));
        } else {
          toast.error(t('systemConfig.testFailed'));
        }
      },
      onError: () => {
        toast.error(t('systemConfig.testFailed'));
      },
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={handleTest}
            disabled={testProvider.isPending}
          >
            {testProvider.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <PlugZap className="size-3.5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {testProvider.isPending
            ? t('systemConfig.testing')
            : t('systemConfig.testConnection')}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => onEdit(provider)}
          >
            <Pencil className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('common.edit')}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost-destructive"
            size="icon"
            className="size-7"
            onClick={() => onDelete(provider)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('common.delete')}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export function ProvidersTab() {
  const { t } = useTranslation();
  const { data: providers, isLoading, error } = useSystemProviders();
  const deleteProvider = useDeleteSystemProvider();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] =
    useState<SystemProviderResponse | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<SystemProviderResponse | null>(null);

  function handleNew() {
    setEditingProvider(null);
    setDialogOpen(true);
  }

  function handleEdit(provider: SystemProviderResponse) {
    setEditingProvider(provider);
    setDialogOpen(true);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteProvider.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success(t('systemConfig.deleted'));
      },
    });
  }

  const columns: Column<SystemProviderResponse>[] = [
    {
      key: 'name',
      header: t('common.name'),
      render: provider => (
        <div>
          <div className="text-foreground text-sm font-medium">
            {provider.name}
          </div>
          <div className="text-foreground-muted mt-0.5 text-xs">
            {provider.baseUrl}
          </div>
        </div>
      ),
    },
    {
      key: 'protocol',
      header: t('providers.protocol'),
      width: '120px',
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
      key: 'status',
      header: t('common.status'),
      width: '100px',
      render: provider => (
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'inline-block size-2 rounded-full',
              provider.isActive ? 'bg-green-500' : 'bg-gray-400'
            )}
          />
          <span className="text-foreground-muted text-xs">
            {provider.isActive ? t('common.active') : t('common.inactive')}
          </span>
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">
          {t('common.failedToLoad', {
            resource: t('systemConfig.providers').toLowerCase(),
          })}
        </h3>
        <p className="text-foreground-muted text-sm">
          {t('common.tryRefreshing')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">
            {t('systemConfig.providers')}
          </h2>
          <p className="text-foreground-muted mt-0.5 text-sm">
            {t('systemConfig.providersDesc')}
          </p>
        </div>
        <Button variant="primary" onClick={handleNew}>
          {t('systemConfig.newProvider')}
        </Button>
      </div>

      {/* Table or empty state */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : !providers?.length ? (
        <EmptyState
          icon={Plug}
          title={t('systemConfig.noProviders')}
          description={t('systemConfig.noProvidersDesc')}
          action={
            <Button variant="primary" onClick={handleNew}>
              {t('systemConfig.addProvider')}
            </Button>
          }
        />
      ) : (
        <DataTable
          columns={columns}
          data={providers}
          keyExtractor={p => p.id}
          rowActions={provider => (
            <ProviderActions
              provider={provider}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
            />
          )}
        />
      )}

      <ProviderFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingProvider={editingProvider}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent variant="destructive">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('systemConfig.deleteProvider')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('systemConfig.deleteConfirm', { name: deleteTarget?.name })}
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

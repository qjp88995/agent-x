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
} from '@agent-x/design';
import type { SystemProviderResponse } from '@agent-x/shared';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { AddCard } from '@/components/shared/add-card';
import {
  useDeleteSystemProvider,
  useSystemProviders,
} from '@/hooks/use-system-config';

import { ProviderCard } from './provider-card';
import { ProviderFormDialog } from './provider-form-dialog';

export function ProvidersTab() {
  const { t } = useTranslation();
  const { data: providers, isLoading, error } = useSystemProviders();
  const deleteProvider = useDeleteSystemProvider();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] =
    useState<SystemProviderResponse | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<SystemProviderResponse | null>(null);

  function handleEdit(provider: SystemProviderResponse) {
    setEditingProvider(provider);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditingProvider(null);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground text-sm">
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
            resource: t('systemConfig.providers').toLowerCase(),
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
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AddCard label={t('systemConfig.addProvider')} onClick={handleAdd} />
        {providers?.map(provider => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
          />
        ))}
      </div>

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

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
import { toast } from 'sonner';

import type { ApiKeyResponse } from '@/hooks/use-api-keys';
import { useDeleteApiKey } from '@/hooks/use-api-keys';

interface DeleteConfirmDialogProps {
  readonly target: ApiKeyResponse | null;
  readonly onOpenChange: (open: boolean) => void;
}

export function DeleteConfirmDialog({
  target,
  onOpenChange,
}: DeleteConfirmDialogProps) {
  const { t } = useTranslation();
  const deleteApiKey = useDeleteApiKey();

  function handleDelete() {
    if (!target) return;
    deleteApiKey.mutate(target.id, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success(t('apiKeys.keyRevoked'));
      },
    });
  }

  return (
    <AlertDialog
      open={target !== null}
      onOpenChange={open => {
        if (!open) onOpenChange(false);
      }}
    >
      <AlertDialogContent variant="destructive">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('apiKeys.revokeTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('apiKeys.revokeConfirm', { name: target?.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteApiKey.isPending}
          >
            {deleteApiKey.isPending
              ? t('apiKeys.revoking')
              : t('apiKeys.revokeKey')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

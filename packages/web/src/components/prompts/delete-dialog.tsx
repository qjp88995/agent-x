import { useTranslation } from 'react-i18next';

import type { PromptResponse } from '@agent-x/shared';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DeleteDialogProps {
  readonly target: PromptResponse | null;
  readonly mode: 'custom' | 'marketplace';
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onConfirm: () => void;
  readonly isLoading: boolean;
}

export function DeleteDialog({
  target,
  mode,
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: DeleteDialogProps) {
  const { t } = useTranslation();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent variant="destructive">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {mode === 'marketplace'
              ? t('prompts.deleteSystemPrompt')
              : t('prompts.deletePrompt')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {mode === 'marketplace'
              ? t('prompts.deleteSystemPromptDesc', {
                  name: target?.name,
                })
              : t('prompts.deletePromptDesc', { name: target?.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? t('common.deleting') : t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

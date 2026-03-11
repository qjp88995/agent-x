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
import type { SkillResponse } from '@agent-x/shared';

interface DeleteDialogProps {
  readonly target: SkillResponse | null;
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
              ? t('skills.deleteSystemSkill')
              : t('skills.deleteSkill')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {mode === 'marketplace'
              ? t('skills.deleteSystemConfirm', {
                  name: target?.name,
                })
              : t('skills.deleteConfirm', { name: target?.name })}
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

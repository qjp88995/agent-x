import { useTranslation } from 'react-i18next';

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ScrollArea,
} from '@agent-x/design';
import type { SkillResponse } from '@agent-x/shared';

interface PreviewDialogProps {
  readonly skill: SkillResponse | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function PreviewDialog({
  skill,
  open,
  onOpenChange,
}: PreviewDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{skill?.name}</DialogTitle>
          <DialogDescription>
            {skill?.description ?? t('common.noDescription')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <pre className="whitespace-pre-wrap rounded-md bg-surface p-4 font-mono text-sm">
            {skill?.content}
          </pre>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('common.close')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

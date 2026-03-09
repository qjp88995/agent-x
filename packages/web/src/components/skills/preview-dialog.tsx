import { useTranslation } from 'react-i18next';

import type { SkillResponse } from '@agent-x/shared';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{skill?.name}</DialogTitle>
          <DialogDescription>
            {skill?.description ?? t('common.noDescription')}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 font-mono text-sm">
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

import { useTranslation } from 'react-i18next';

import type { PromptResponse } from '@agent-x/shared';

import { Badge } from '@/components/ui/badge';
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
  readonly prompt: PromptResponse | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function PreviewDialog({
  prompt,
  open,
  onOpenChange,
}: PreviewDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{prompt?.name}</DialogTitle>
          <DialogDescription>
            {prompt?.description ?? t('common.noDescription')}
          </DialogDescription>
        </DialogHeader>
        {(prompt?.category || (prompt?.tags && prompt.tags.length > 0)) && (
          <div className="flex flex-wrap gap-1.5">
            {prompt.category && (
              <Badge variant="secondary">{prompt.category.name}</Badge>
            )}
            {prompt.tags.map(tag => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <ScrollArea className="max-h-[60vh]">
          <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 font-mono text-sm">
            {prompt?.content}
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

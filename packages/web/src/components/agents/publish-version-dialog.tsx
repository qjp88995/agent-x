import { useTranslation } from 'react-i18next';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type PublishVersionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changelog: string;
  onChangelogChange: (value: string) => void;
  onPublish: () => void;
  isPublishing: boolean;
};

function PublishVersionDialog({
  open,
  onOpenChange,
  changelog,
  onChangelogChange,
  onPublish,
  isPublishing,
}: PublishVersionDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('agents.publishNewVersion')}</DialogTitle>
          <DialogDescription>{t('agents.publishDesc')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="changelog">{t('agents.changelog')}</Label>
          <Textarea
            id="changelog"
            placeholder={t('agents.changelogPlaceholder')}
            value={changelog}
            onChange={e => onChangelogChange(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onPublish} disabled={isPublishing} variant="primary">
            {isPublishing && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t('agents.publish')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { PublishVersionDialog };
export type { PublishVersionDialogProps };

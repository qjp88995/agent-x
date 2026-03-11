import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Bookmark, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreatePrompt } from '@/hooks/use-prompts';

interface SavePromptButtonProps {
  readonly content: string;
  readonly defaultName?: string;
  readonly disabled?: boolean;
}

export function SavePromptButton({
  content,
  defaultName,
  disabled,
}: SavePromptButtonProps) {
  const { t } = useTranslation();
  const createPrompt = useCreatePrompt();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');

  function openDialog() {
    setSaveName(defaultName ? `${defaultName} - System Prompt` : '');
    setSaveDescription('');
    setDialogOpen(true);
  }

  async function handleConfirm() {
    const trimmed = content?.trim();
    if (!trimmed || !saveName.trim()) return;

    try {
      await createPrompt.mutateAsync({
        name: saveName.trim(),
        ...(saveDescription.trim()
          ? { description: saveDescription.trim() }
          : {}),
        content: trimmed,
      });
      setDialogOpen(false);
      toast.success(t('prompts.savedToMyPrompts'));
    } catch {
      toast.error(t('prompts.saveToMyPromptsFailed'));
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={openDialog}
        disabled={disabled || !content?.trim()}
      >
        <Bookmark className="size-4 sm:mr-2" />
        <span className="hidden sm:inline">{t('prompts.saveToMyPrompts')}</span>
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('prompts.saveToMyPrompts')}</DialogTitle>
            <DialogDescription>
              {t('prompts.promptDetailsDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label>{t('common.name')}</Label>
              <Input
                placeholder={t('prompts.namePlaceholder')}
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                disabled={createPrompt.isPending}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>
                {t('common.description')} {t('common.optional')}
              </Label>
              <Textarea
                placeholder={t('prompts.descPlaceholder')}
                value={saveDescription}
                onChange={e => setSaveDescription(e.target.value)}
                disabled={createPrompt.isPending}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={createPrompt.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirm}
              disabled={!saveName.trim() || createPrompt.isPending}
            >
              {createPrompt.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

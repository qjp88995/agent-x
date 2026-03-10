import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { PromptEditor } from '@/components/shared/prompt-editor';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFeatureStatus, usePolishPrompt } from '@/hooks/use-system-config';

interface PolishButtonProps {
  readonly content: string;
  readonly onApply: (polished: string) => void;
  readonly disabled?: boolean;
}

export function PolishButton({
  content,
  onApply,
  disabled,
}: PolishButtonProps) {
  const { t } = useTranslation();
  const polishPrompt = usePolishPrompt();
  const { data: polishStatus } = useFeatureStatus('PROMPT_POLISH');
  const isPolishAvailable = polishStatus?.enabled ?? false;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [polishedContent, setPolishedContent] = useState('');

  async function handlePolish() {
    const trimmed = content?.trim();
    if (!trimmed) return;

    try {
      const result = await polishPrompt.mutateAsync(trimmed);
      setPolishedContent(result.result);
      setDialogOpen(true);
    } catch {
      toast.error(t('systemConfig.polishFailed'));
    }
  }

  function handleApply() {
    onApply(polishedContent);
    setDialogOpen(false);
    setPolishedContent('');
    toast.success(t('systemConfig.polishDone'));
  }

  function handleDiscard() {
    setDialogOpen(false);
    setPolishedContent('');
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePolish}
              disabled={
                !isPolishAvailable ||
                disabled ||
                polishPrompt.isPending ||
                !content?.trim()
              }
            >
              {polishPrompt.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" />
              )}
              {polishPrompt.isPending
                ? t('systemConfig.polishing')
                : t('systemConfig.polish')}
            </Button>
          </span>
        </TooltipTrigger>
        {!isPolishAvailable && (
          <TooltipContent>
            {t('systemConfig.polishNotConfigured')}
          </TooltipContent>
        )}
      </Tooltip>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] max-w-3xl flex flex-col">
          <DialogHeader>
            <DialogTitle>{t('systemConfig.promptPolish')}</DialogTitle>
            <DialogDescription>
              {t('systemConfig.promptPolishDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-auto">
            <PromptEditor
              value={polishedContent}
              disabled
              className="max-h-[50vh]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDiscard}>
              {t('systemConfig.discardPolish')}
            </Button>
            <Button variant="primary" onClick={handleApply}>
              {t('systemConfig.applyPolish')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

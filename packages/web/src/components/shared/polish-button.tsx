import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  PromptEditor,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@agent-x/design';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { useFeatureStatus, usePolishPrompt } from '@/hooks/use-system-config';

const PRESET_KEYS = [
  'polishPresetConcise',
  'polishPresetDetailed',
  'polishPresetProfessional',
  'polishPresetFriendly',
  'polishPresetStructured',
] as const;

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
  const hasContent = !!content?.trim();
  const isDisabled =
    !isPolishAvailable || disabled || polishPrompt.isPending || !hasContent;

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [polishedContent, setPolishedContent] = useState('');

  async function handlePolish() {
    const trimmed = content?.trim();
    if (!trimmed) return;

    setPopoverOpen(false);

    try {
      const result = await polishPrompt.mutateAsync({
        content: trimmed,
        description: description.trim() || undefined,
      });
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
    setDescription('');
    toast.success(t('systemConfig.polishDone'));
  }

  function handleDiscard() {
    setDialogOpen(false);
    setPolishedContent('');
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={isDisabled ? 'cursor-not-allowed' : ''}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isDisabled}
                >
                  {polishPrompt.isPending ? (
                    <Loader2 className="size-4 animate-spin sm:mr-2" />
                  ) : (
                    <Sparkles className="size-4 sm:mr-2" />
                  )}
                  <span className="hidden sm:inline">
                    {polishPrompt.isPending
                      ? t('systemConfig.polishing')
                      : t('systemConfig.polish')}
                  </span>
                </Button>
              </PopoverTrigger>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {!isPolishAvailable
              ? t('systemConfig.polishNotConfigured')
              : !hasContent
                ? t('systemConfig.polishEmpty')
                : polishPrompt.isPending
                  ? t('systemConfig.polishing')
                  : t('systemConfig.polish')}
          </TooltipContent>
        </Tooltip>
        <PopoverContent className="w-80" align="end">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">
              {t('systemConfig.polishDescriptionLabel')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_KEYS.map(key => {
                const label = t(`systemConfig.${key}`);
                const isActive = description === label;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                      isActive
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-surface/50 text-foreground-muted hover:border-primary/50 hover:text-foreground'
                    }`}
                    onClick={() =>
                      setDescription(prev => (prev === label ? '' : label))
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <Textarea
              placeholder={t('systemConfig.polishDescriptionPlaceholder')}
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void handlePolish();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPopoverOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => void handlePolish()}
              >
                <Sparkles className="mr-2 size-3.5" />
                {t('systemConfig.startPolish')}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

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

import { useTranslation } from 'react-i18next';

import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAutoFill, useFeatureStatus } from '@/hooks/use-system-config';

interface AutoFillButtonProps {
  /** The source content to generate from (e.g., system prompt) */
  readonly content: string;
  /** Description of what to generate for this field */
  readonly fieldDescription: string;
  /** Callback with the generated value */
  readonly onResult: (value: string) => void;
  readonly disabled?: boolean;
}

export function AutoFillButton({
  content,
  fieldDescription,
  onResult,
  disabled,
}: AutoFillButtonProps) {
  const { t } = useTranslation();
  const autoFill = useAutoFill();
  const { data: featureStatus } = useFeatureStatus('FORM_AUTO_FILL');
  const isAvailable = featureStatus?.enabled ?? false;
  const hasContent = !!content?.trim();
  const isDisabled =
    !isAvailable || disabled || autoFill.isPending || !hasContent;

  async function handleClick() {
    const trimmed = content?.trim();
    if (!trimmed) {
      toast.error(t('systemConfig.autoFillEmpty'));
      return;
    }

    try {
      const { result } = await autoFill.mutateAsync({
        content: trimmed,
        outputSchema: {
          value: { type: 'string', description: fieldDescription },
        },
      });
      onResult(result.value);
    } catch {
      toast.error(t('systemConfig.autoFillFailed'));
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={isDisabled ? 'cursor-not-allowed' : ''}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={handleClick}
            disabled={isDisabled}
          >
            {autoFill.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {!isAvailable
          ? t('systemConfig.autoFillNotConfigured')
          : !hasContent
            ? t('systemConfig.autoFillEmpty')
            : autoFill.isPending
              ? t('systemConfig.autoFilling')
              : t('systemConfig.autoFill')}
      </TooltipContent>
    </Tooltip>
  );
}

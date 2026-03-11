import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@agent-x/design';
import { BookOpen } from 'lucide-react';

import { PromptPickerDialog } from '@/components/prompts/prompt-picker-dialog';
interface PromptPickerButtonProps {
  readonly onSelect: (content: string) => void;
  readonly disabled?: boolean;
}

export function PromptPickerButton({
  onSelect,
  disabled,
}: PromptPickerButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={disabled}
      >
        <BookOpen className="size-4 sm:mr-2" />
        <span className="hidden sm:inline">{t('prompts.browseLibrary')}</span>
      </Button>

      <PromptPickerDialog
        open={open}
        onOpenChange={setOpen}
        onSelect={onSelect}
      />
    </>
  );
}

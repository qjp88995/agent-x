import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BookOpen } from 'lucide-react';

import { PromptPickerDialog } from '@/components/prompts/prompt-picker-dialog';
import { Button } from '@/components/ui/button';

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
        <BookOpen className="mr-2 size-4" />
        {t('prompts.browseLibrary')}
      </Button>

      <PromptPickerDialog
        open={open}
        onOpenChange={setOpen}
        onSelect={onSelect}
      />
    </>
  );
}

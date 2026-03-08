import type { ReactNode } from 'react';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FormFooterProps {
  readonly onCancel: () => void;
  readonly isSaving: boolean;
  readonly submitLabel: string;
  readonly cancelLabel: string;
  readonly disabled?: boolean;
  readonly maxWidth?: string;
  readonly icon?: ReactNode;
}

export function FormFooter({
  onCancel,
  isSaving,
  submitLabel,
  cancelLabel,
  disabled = false,
  maxWidth,
  icon,
}: FormFooterProps) {
  return (
    <div className={cn('flex justify-end gap-3 border-t pt-6', maxWidth)}>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSaving}
      >
        {cancelLabel}
      </Button>
      <Button type="submit" disabled={disabled || isSaving} variant="gradient">
        {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
        {icon}
        {submitLabel}
      </Button>
    </div>
  );
}

import type { ReactNode } from 'react';

import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FormFooterProps {
  readonly onCancel: () => void;
  readonly isSaving: boolean;
  readonly submitLabel: string;
  readonly cancelLabel: string;
  readonly disabled?: boolean;
  readonly variant?: 'card' | 'standalone';
  readonly maxWidth?: string;
  readonly icon?: ReactNode;
}

export function FormFooter({
  onCancel,
  isSaving,
  submitLabel,
  cancelLabel,
  disabled = false,
  variant = 'card',
  maxWidth,
  icon,
}: FormFooterProps) {
  const content = (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSaving}
      >
        {cancelLabel}
      </Button>
      <Button
        type="submit"
        disabled={disabled || isSaving}
        className="gradient-bg cursor-pointer text-white hover:opacity-90"
      >
        {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
        {icon}
        {submitLabel}
      </Button>
    </>
  );

  if (variant === 'card') {
    return (
      <CardFooter className="flex justify-end gap-3 border-t pt-6">
        {content}
      </CardFooter>
    );
  }

  return (
    <div className={cn('flex justify-end gap-3 border-t pt-6', maxWidth)}>
      {content}
    </div>
  );
}

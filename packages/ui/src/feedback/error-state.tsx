import type { LucideIcon } from 'lucide-react';
import { AlertTriangle } from 'lucide-react';

import { cn } from '../lib/utils';
import { Button } from '../primitives/button';

interface ErrorStateProps {
  readonly icon?: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly className?: string;
}

export function ErrorState({
  icon: Icon = AlertTriangle,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16',
        className
      )}
    >
      <Icon className="text-destructive mb-4 size-10" />
      <h3 className="mb-1 font-semibold">{title}</h3>
      <p className="text-foreground-muted mb-4 text-sm">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

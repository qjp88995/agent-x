import { Link } from 'react-router';

import { Button } from '@agent-x/design';
import type { LucideIcon } from 'lucide-react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description?: string;
  readonly actionLabel?: string;
  readonly actionTo?: string;
  readonly action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="bg-primary mb-4 flex size-16 items-center justify-center rounded-full text-white">
        <Icon className="size-8" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-foreground-muted mb-6 text-sm">{description}</p>
      )}
      {action}
      {!action && actionLabel && actionTo && (
        <Button asChild variant="primary">
          <Link to={actionTo}>
            <Plus className="mr-2 size-4" />
            {actionLabel}
          </Link>
        </Button>
      )}
    </div>
  );
}

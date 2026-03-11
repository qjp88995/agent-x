import { Link } from 'react-router';

import { Button } from '@agent-x/design';
import type { LucideIcon } from 'lucide-react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly actionLabel?: string;
  readonly actionTo?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="gradient-bg mb-4 flex size-16 items-center justify-center rounded-full text-white">
        <Icon className="size-8" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mb-6 text-sm">{description}</p>
      {actionLabel && actionTo && (
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

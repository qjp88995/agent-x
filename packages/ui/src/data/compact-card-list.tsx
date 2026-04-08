import type { ReactNode } from 'react';

import { cn } from '../lib/utils';

function CompactCardList({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>{children}</div>
  );
}

function CompactCardItem({
  icon,
  title,
  subtitle,
  badges,
  actions,
  className,
  onClick,
}: {
  readonly icon?: ReactNode;
  readonly title: string;
  readonly subtitle?: string;
  readonly badges?: ReactNode;
  readonly actions?: ReactNode;
  readonly className?: string;
  readonly onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-primary/20 hover:shadow-md',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick();
            }
          : undefined
      }
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="flex min-w-0 items-center gap-3">
        {icon && <div className="shrink-0">{icon}</div>}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{title}</span>
            {badges}
          </div>
          {subtitle && (
            <div className="text-foreground-muted mt-0.5 truncate text-xs">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}

export { CompactCardItem, CompactCardList };

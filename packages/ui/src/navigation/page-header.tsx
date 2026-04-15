import * as React from 'react';

import { Search } from 'lucide-react';

import { cn } from '../lib/utils';

type PageHeaderProps = {
  title: string;
  description?: string;
  leading?: React.ReactNode;
  search?: boolean;
  onSearchClick?: () => void;
  actions?: React.ReactNode;
  className?: string;
};

function PageHeader({
  title,
  description,
  leading,
  search,
  onSearchClick,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between h-(--header-height) px-4 border-b border-border shrink-0',
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {leading}
        <h1 className="text-[13px] font-semibold text-foreground tracking-[-0.3px] truncate">
          {title}
        </h1>
        {description && (
          <span className="hidden sm:inline text-xs text-foreground-dim shrink-0">
            {description}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {search && (
          <button
            type="button"
            onClick={onSearchClick}
            className="inline-flex items-center gap-2 h-7 px-2.5 rounded-sm border border-border bg-card text-[11px] text-foreground-ghost hover:text-foreground-muted transition-colors duration-(--duration-fast)"
          >
            <Search className="size-3.5" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline text-[9px] text-foreground-dim bg-background border border-border rounded px-1 py-0.5 ml-1">
              ⌘K
            </kbd>
          </button>
        )}
        {actions}
      </div>
    </header>
  );
}

export { PageHeader };

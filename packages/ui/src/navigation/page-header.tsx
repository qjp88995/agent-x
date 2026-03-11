import * as React from 'react';
import { cn } from '../lib/utils';
import { Search } from 'lucide-react';

type PageHeaderProps = {
  title: string;
  description?: string;
  search?: boolean;
  onSearchClick?: () => void;
  actions?: React.ReactNode;
  className?: string;
};

function PageHeader({ title, description, search, onSearchClick, actions, className }: PageHeaderProps) {
  return (
    <header className={cn(
      'flex items-center justify-between h-[var(--header-height)] px-4 border-b border-border shrink-0',
      className
    )}>
      <div className="flex items-center gap-3">
        <h1 className="text-[13px] font-semibold text-foreground tracking-[-0.3px]">{title}</h1>
        {description && (
          <span className="text-[10px] text-foreground-dim">{description}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {search && (
          <button
            type="button"
            onClick={onSearchClick}
            className="inline-flex items-center gap-2 h-7 px-2.5 rounded-[var(--radius-sm)] border border-border bg-card text-[11px] text-foreground-ghost hover:text-foreground-muted transition-colors duration-[var(--duration-fast)]"
          >
            <Search className="size-3.5" />
            <span>Search...</span>
            <kbd className="text-[9px] text-foreground-dim bg-background border border-border rounded px-1 py-0.5 ml-1">⌘K</kbd>
          </button>
        )}
        {actions}
      </div>
    </header>
  );
}

export { PageHeader };

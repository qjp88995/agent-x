import { LayoutGrid,List } from 'lucide-react';

import { cn } from '../lib/utils';

type ViewMode = 'table' | 'grid';

type ViewToggleProps = {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  className?: string;
};

function ViewToggle({ value, onChange, className }: ViewToggleProps) {
  return (
    <div className={cn('inline-flex items-center rounded-sm border border-border bg-card', className)}>
      <button
        type="button"
        onClick={() => onChange('table')}
        className={cn(
          'inline-flex items-center justify-center h-7 w-7 transition-colors duration-(--duration-fast)',
          'rounded-l-[calc(var(--radius-sm)-1px)]',
          value === 'table' ? 'text-foreground bg-surface' : 'text-foreground-ghost hover:text-foreground-muted'
        )}
      >
        <List className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={cn(
          'inline-flex items-center justify-center h-7 w-7 transition-colors duration-(--duration-fast)',
          'rounded-r-[calc(var(--radius-sm)-1px)]',
          value === 'grid' ? 'text-foreground bg-surface' : 'text-foreground-ghost hover:text-foreground-muted'
        )}
      >
        <LayoutGrid className="size-3.5" />
      </button>
    </div>
  );
}

export { type ViewMode,ViewToggle };

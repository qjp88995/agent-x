import { cn } from '../lib/utils';

type FilterTab = {
  key: string;
  label: string;
  count?: number;
};

type FilterTabsProps = {
  tabs: FilterTab[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
};

function FilterTabs({ tabs, value, onChange, className }: FilterTabsProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12px] font-medium transition-colors duration-[var(--duration-fast)] border-b-2 -mb-px',
            value === tab.key
              ? 'text-foreground border-primary'
              : 'text-foreground-ghost border-transparent hover:text-foreground-muted'
          )}
        >
          {tab.label}
          {tab.count != null && (
            <span
              className={cn(
                'text-[10px]',
                value === tab.key ? 'text-foreground-muted' : 'text-foreground-ghost'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export { FilterTabs, type FilterTab };

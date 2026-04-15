import { createContext, type ReactNode, use } from 'react';

import type { LucideIcon } from 'lucide-react';

import { cn } from '../lib/utils';

type SettingsNavContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const SettingsNavContext = createContext<SettingsNavContextValue | null>(null);

function useSettingsNav() {
  const ctx = use(SettingsNavContext);
  if (!ctx) throw new Error('useSettingsNav must be used within SettingsNav');
  return ctx;
}

function SettingsNav({
  value,
  onValueChange,
  children,
  className,
}: {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <SettingsNavContext value={{ value, onValueChange }}>
      <nav
        className={cn(
          'flex flex-row gap-1 overflow-x-auto sm:flex-col sm:gap-4',
          className
        )}
      >
        {children}
      </nav>
    </SettingsNavContext>
  );
}

function SettingsNavGroup({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="contents sm:block">
      <div className="text-foreground-ghost hidden px-2 pb-1.5 text-[9px] font-semibold uppercase tracking-wider sm:block">
        {title}
      </div>
      <div className="flex flex-row gap-0.5 sm:flex-col">{children}</div>
    </div>
  );
}

function SettingsNavItem({
  value,
  icon: Icon,
  count,
  children,
}: {
  readonly value: string;
  readonly icon: LucideIcon;
  readonly count?: number;
  readonly children: ReactNode;
}) {
  const { value: activeValue, onValueChange } = useSettingsNav();
  const isActive = activeValue === value;

  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={cn(
        'flex shrink-0 items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors',
        'rounded-md sm:rounded-r-md sm:border-l-2 sm:px-2',
        isActive
          ? 'bg-primary/8 text-primary font-medium sm:border-primary sm:bg-primary/6'
          : 'border-transparent text-foreground-muted hover:bg-card sm:border-transparent'
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{children}</span>
      {count !== undefined && (
        <span
          className={cn(
            'rounded-full px-1.5 text-xs',
            isActive
              ? 'bg-primary/10 text-primary'
              : 'bg-surface text-foreground-ghost'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export { SettingsNav, SettingsNavGroup, SettingsNavItem };

import { createContext, use, type ReactNode } from 'react';

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
      <nav className={cn('flex flex-col gap-4', className)}>{children}</nav>
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
    <div>
      <div className="text-foreground-ghost px-2 pb-1.5 text-[9px] font-semibold uppercase tracking-wider">
        {title}
      </div>
      <div className="flex flex-col gap-0.5">{children}</div>
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
        'flex items-center gap-2 rounded-r-md border-l-2 px-2 py-1.5 text-left text-sm transition-colors',
        isActive
          ? 'border-primary bg-primary/6 text-primary font-medium'
          : 'border-transparent text-foreground-muted hover:bg-card'
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 truncate">{children}</span>
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

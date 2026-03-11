import type { ReactNode } from 'react';

import { Input } from '@agent-x/design';
import { Search } from 'lucide-react';

interface SearchProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
}

interface ListPageHeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly search?: SearchProps;
  readonly trailing?: ReactNode;
}

export function ListPageHeader({
  title,
  subtitle,
  search,
  trailing,
}: ListPageHeaderProps) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold leading-none">
          {title}
        </span>
        {subtitle && (
          <span className="text-foreground-muted mt-0.5 truncate text-xs leading-none">
            {subtitle}
          </span>
        )}
      </div>

      {search && (
        <div className="relative ml-2 flex-1 max-w-xs">
          <Search className="text-foreground-ghost pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2" />
          <Input
            value={search.value}
            onChange={e => search.onChange(e.target.value)}
            placeholder={search.placeholder ?? 'Search…'}
            className="h-7 pl-8 text-sm"
          />
        </div>
      )}

      {trailing && (
        <div className="ml-auto flex items-center gap-2">{trailing}</div>
      )}
    </div>
  );
}

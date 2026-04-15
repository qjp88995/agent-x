import type { ReactNode } from 'react';

import { cn } from '../lib/utils';

function SettingsLayout({
  sidebar,
  children,
  className,
}: {
  readonly sidebar: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-1 flex-col overflow-hidden sm:flex-row',
        className
      )}
    >
      <aside className="shrink-0 border-b border-border p-2 sm:w-50 sm:overflow-y-auto sm:border-b-0 sm:border-r sm:p-4">
        {sidebar}
      </aside>
      <main className="flex-1 overflow-y-auto p-5">{children}</main>
    </div>
  );
}

export { SettingsLayout };

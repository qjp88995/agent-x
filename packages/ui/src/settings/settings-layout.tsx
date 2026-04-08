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
    <div className={cn('flex flex-1 overflow-hidden', className)}>
      <aside className="w-50 shrink-0 overflow-y-auto border-r border-border p-4">
        {sidebar}
      </aside>
      <main className="flex-1 overflow-y-auto p-5">{children}</main>
    </div>
  );
}

export { SettingsLayout };

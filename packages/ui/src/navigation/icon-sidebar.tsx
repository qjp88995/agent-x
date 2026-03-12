import * as React from 'react';

import { cn } from '../lib/utils';

type SidebarItem = {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  badge?: string | number;
};

type IconSidebarProps = {
  items: SidebarItem[];
  logo?: React.ReactNode;
  footer?: React.ReactNode;
  onItemClick?: (item: SidebarItem) => void;
  className?: string;
};

function DefaultLogo() {
  return (
    <div className="flex h-12 items-center justify-center overflow-hidden">
      {/* Collapsed: emerald square with X */}
      <div className="flex shrink-0 items-center justify-center rounded-sm bg-primary size-8">
        <span className="text-[13px] font-bold text-primary-foreground leading-none">X</span>
      </div>
      {/* Expanded: brand text (fades in) */}
      <span className="ml-2 text-[13px] font-semibold text-foreground whitespace-nowrap opacity-0 transition-opacity duration-150 delay-50 group-hover/sidebar:opacity-100">
        Agent-X
      </span>
    </div>
  );
}

function IconSidebar({ items, logo, footer, onItemClick, className }: IconSidebarProps) {
  return (
    <aside
      className={cn(
        // Layout
        'group/sidebar fixed left-0 top-0 z-40 flex h-full flex-col overflow-hidden',
        // Width transition (CSS hover-driven)
        'w-(--sidebar-collapsed) hover:w-(--sidebar-expanded)',
        'transition-[width] duration-200 ease-in-out',
        // Appearance
        'border-r border-border bg-background',
        className
      )}
    >
      {/* Logo area */}
      <div className="flex shrink-0 items-center px-2">
        {logo ?? <DefaultLogo />}
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-hidden px-2 py-2">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            onClick={(e) => {
              if (onItemClick) {
                e.preventDefault();
                onItemClick(item);
              }
            }}
            className={cn(
              'flex h-9 items-center rounded-sm px-2 gap-2.5 transition-colors duration-(--duration-fast)',
              item.active
                ? 'bg-primary-muted text-primary'
                : 'text-foreground-ghost hover:text-foreground-muted hover:bg-card'
            )}
          >
            {/* Icon */}
            <span className="shrink-0 size-4.5 flex items-center justify-center">
              {item.icon}
            </span>

            {/* Label */}
            <span
              className={cn(
                'flex-1 text-[12px] font-medium whitespace-nowrap',
                'opacity-0 transition-opacity duration-150 delay-50 group-hover/sidebar:opacity-100'
              )}
            >
              {item.label}
            </span>

            {/* Badge */}
            {item.badge != null && (
              <span
                className={cn(
                  'ml-auto flex min-w-4 h-4 items-center justify-center rounded-full px-1',
                  'text-[9px] font-semibold leading-none',
                  'bg-primary text-primary-foreground',
                  'opacity-0 transition-opacity duration-150 delay-50 group-hover/sidebar:opacity-100'
                )}
              >
                {item.badge}
              </span>
            )}
          </a>
        ))}
      </nav>

      {/* Footer slot */}
      {footer && (
        <div className="mt-auto shrink-0 px-2 py-2 overflow-hidden">
          {footer}
        </div>
      )}
    </aside>
  );
}

export { IconSidebar, type SidebarItem };

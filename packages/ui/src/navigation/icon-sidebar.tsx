import { type ReactNode } from 'react';

import { cn } from '../lib/utils';

type SidebarItem = {
  icon: ReactNode;
  label: string;
  href: string;
  active?: boolean;
  badge?: string | number;
};

type SidebarFooter = {
  avatar: ReactNode;
  label?: string;
  actions?: ReactNode;
};

type IconSidebarProps = {
  items: SidebarItem[];
  bottomItems?: SidebarItem[];
  logo?: ReactNode;
  footer?: SidebarFooter;
  onItemClick?: (item: SidebarItem) => void;
  className?: string;
};

function DefaultLogo() {
  return (
    <div className="flex h-12 items-center">
      <div className="flex shrink-0 items-center justify-center rounded-md bg-primary size-8">
        <span className="text-[13px] font-bold text-primary-foreground leading-none">
          X
        </span>
      </div>
      <span className="ml-2 text-[13px] font-semibold text-foreground whitespace-nowrap opacity-0 transition-opacity duration-150 delay-50 group-hover/sidebar:opacity-100">
        Agent-X
      </span>
    </div>
  );
}

function NavItem({
  item,
  onItemClick,
}: {
  item: SidebarItem;
  onItemClick?: (item: SidebarItem) => void;
}) {
  return (
    <a
      href={item.href}
      onClick={e => {
        if (onItemClick) {
          e.preventDefault();
          onItemClick(item);
        }
      }}
      className={cn(
        'flex h-9 items-center rounded-md px-2 gap-2.5 transition-colors duration-(--duration-fast)',
        item.active
          ? 'bg-primary-muted text-primary'
          : 'text-foreground-ghost hover:text-foreground-muted hover:bg-card'
      )}
    >
      <span className="shrink-0 size-4.5 flex items-center justify-center">
        {item.icon}
      </span>

      <span
        className={cn(
          'flex-1 text-[12px] font-medium whitespace-nowrap',
          'opacity-0 transition-opacity duration-150 delay-50 group-hover/sidebar:opacity-100'
        )}
      >
        {item.label}
      </span>

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
  );
}

function IconSidebar({
  items,
  bottomItems,
  logo,
  footer,
  onItemClick,
  className,
}: IconSidebarProps) {
  return (
    <aside
      className={cn(
        'group/sidebar fixed left-0 top-0 z-40 flex h-full flex-col overflow-hidden',
        'w-(--sidebar-collapsed) hover:w-(--sidebar-expanded)',
        'transition-[width] duration-200 ease-in-out',
        'border-r border-border bg-background',
        className
      )}
    >
      {/* Logo */}
      <div className="flex shrink-0 items-center px-2 mb-4">
        {logo ?? <DefaultLogo />}
      </div>

      {/* Main nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-hidden px-2">
        {items.map(item => (
          <NavItem key={item.href} item={item} onItemClick={onItemClick} />
        ))}
      </nav>

      {/* Bottom nav */}
      {bottomItems && bottomItems.length > 0 && (
        <nav className="flex shrink-0 flex-col gap-1 px-2 py-2">
          {bottomItems.map(item => (
            <NavItem key={item.href} item={item} onItemClick={onItemClick} />
          ))}
        </nav>
      )}

      {/* Footer */}
      {footer && (
        <div className="shrink-0 px-2 py-2 overflow-hidden">
          <div className="border-t border-border mb-2" />
          <div className="flex h-9 items-center rounded-md px-2 gap-2.5">
            <span className="shrink-0 flex items-center justify-center">
              {footer.avatar}
            </span>
            {footer.label && (
              <span
                className={cn(
                  'flex-1 truncate text-[12px] font-medium text-foreground-muted',
                  'opacity-0 transition-opacity duration-150 delay-50 group-hover/sidebar:opacity-100'
                )}
              >
                {footer.label}
              </span>
            )}
          </div>
          {footer.actions && (
            <div
              className={cn(
                'flex items-center gap-1 px-2 pt-1',
                'opacity-0 transition-opacity duration-150 delay-50 group-hover/sidebar:opacity-100'
              )}
            >
              {footer.actions}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

export { IconSidebar, type SidebarFooter,type SidebarItem };

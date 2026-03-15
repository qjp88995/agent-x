import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';

import {
  Avatar,
  Button,
  IconSidebar,
  PageTransition,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  type SidebarFooter,
  type SidebarItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@agent-x/design';
import { AnimatePresence } from 'framer-motion';
import {
  Bot,
  Database,
  Key,
  LogOut,
  Menu,
  MessageSquarePlus,
  Monitor,
  Moon,
  Server,
  Settings,
  Sparkles,
  Store,
  Sun,
  Users,
  Wrench,
} from 'lucide-react';

import { AppCommandPalette } from '@/components/shared/app-command-palette';
import { useIsAdmin } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';

interface NavDef {
  readonly labelKey: string;
  readonly href: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly adminOnly?: boolean;
}

const NAV_ITEMS: readonly NavDef[] = [
  { labelKey: 'nav.providers', href: '/providers', icon: Database },
  { labelKey: 'nav.agents', href: '/agents', icon: Bot },
  { labelKey: 'nav.mcpServers', href: '/mcp-servers', icon: Server },
  { labelKey: 'nav.prompts', href: '/prompts', icon: MessageSquarePlus },
  { labelKey: 'nav.skills', href: '/skills', icon: Sparkles },
  { labelKey: 'nav.marketplace', href: '/marketplace', icon: Store },
  { labelKey: 'nav.apiKeys', href: '/api-keys', icon: Key },
  { labelKey: 'nav.users', href: '/users', icon: Users, adminOnly: true },
] as const;

const BOTTOM_NAV_ITEMS: readonly NavDef[] = [
  { labelKey: 'nav.preferences', href: '/settings', icon: Settings },
  {
    labelKey: 'nav.systemConfig',
    href: '/system-config',
    icon: Wrench,
    adminOnly: true,
  },
] as const;

const THEME_CYCLE = ['system', 'light', 'dark'] as const;
const THEME_ICON = {
  system: Monitor,
  light: Sun,
  dark: Moon,
} as const;

function ThemeToggle() {
  const { t } = useTranslation();
  const theme = useThemeStore(s => s.theme);
  const setTheme = useThemeStore(s => s.setTheme);

  const nextTheme =
    THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length];
  const Icon = THEME_ICON[theme];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(nextTheme)}
          className="text-foreground-ghost hover:text-foreground-muted"
          aria-label={t('settings.theme')}
        >
          <Icon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t('settings.theme')}</TooltipContent>
    </Tooltip>
  );
}

function useSidebarFooter(): SidebarFooter {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  const displayName = user?.name ?? user?.email ?? 'User';

  return {
    avatar: <Avatar name={displayName} size="sm" />,
    label: displayName,
    actions: (
      <>
        <ThemeToggle />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={logout}
              className="text-foreground-ghost hover:text-foreground-muted"
              aria-label={t('auth.signOut')}
            >
              <LogOut className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('auth.signOut')}</TooltipContent>
        </Tooltip>
      </>
    ),
  };
}

function useNavItems(defs: readonly NavDef[]): SidebarItem[] {
  const location = useLocation();
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();

  return defs
    .filter(item => !item.adminOnly || isAdmin)
    .map(item => {
      const Icon = item.icon;
      const isActive =
        location.pathname === item.href ||
        location.pathname.startsWith(`${item.href}/`);

      return {
        icon: <Icon className="size-4.5" />,
        label: t(item.labelKey),
        href: item.href,
        active: isActive,
      };
    });
}

function MobileNav({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const location = useLocation();
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();

  const allItems = [...NAV_ITEMS, ...BOTTOM_NAV_ITEMS].filter(
    item => !item.adminOnly || isAdmin
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="h-12 flex-row items-center px-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary">
              <span className="text-xs font-bold text-primary-foreground leading-none">
                X
              </span>
            </div>
            <span className="text-[13px] font-semibold">Agent-X</span>
          </SheetTitle>
        </SheetHeader>
        <div className="border-t border-border mx-3" />
        <ScrollArea className="flex-1 py-3">
          <nav className="flex flex-col gap-0.5 px-3">
            {allItems.map(item => {
              const isActive =
                location.pathname === item.href ||
                location.pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-muted text-primary'
                      : 'text-foreground-ghost hover:text-foreground-muted hover:bg-card'
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export default function DashboardLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = useNavItems(NAV_ITEMS);
  const bottomItems = useNavItems(BOTTOM_NAV_ITEMS);
  const footer = useSidebarFooter();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <IconSidebar
          items={items}
          bottomItems={bottomItems}
          onItemClick={item => navigate(item.href)}
          footer={footer}
        />
      </div>

      {/* Mobile sidebar */}
      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden md:ml-(--sidebar-collapsed)">
        {/* Mobile top bar */}
        <header className="flex h-12 items-center gap-3 border-b bg-background px-4 md:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileOpen(true)}
            aria-label={t('nav.openMenu')}
          >
            <Menu className="size-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-sm bg-primary">
              <span className="text-[10px] font-bold text-primary-foreground leading-none">
                X
              </span>
            </div>
            <span className="text-sm font-semibold">Agent-X</span>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-auto">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
      <AppCommandPalette />
    </div>
  );
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation } from 'react-router';

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
  Sun,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';

interface NavItem {
  readonly labelKey: string;
  readonly href: string;
  readonly icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: readonly NavItem[] = [
  { labelKey: 'nav.providers', href: '/providers', icon: Database },
  { labelKey: 'nav.agents', href: '/agents', icon: Bot },
  { labelKey: 'nav.mcpServers', href: '/mcp-servers', icon: Server },
  { labelKey: 'nav.skills', href: '/skills', icon: Sparkles },
  { labelKey: 'nav.prompts', href: '/prompts', icon: MessageSquarePlus },
  { labelKey: 'nav.apiKeys', href: '/api-keys', icon: Key },
  { labelKey: 'nav.settings', href: '/settings', icon: Settings },
] as const;

function getInitials(
  name: string | undefined,
  email: string | undefined
): string {
  if (name) {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return 'U';
}

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
          size="icon"
          onClick={() => setTheme(nextTheme)}
          className="text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground size-8"
          aria-label={t('settings.theme')}
        >
          <Icon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t('settings.theme')}</TooltipContent>
    </Tooltip>
  );
}

function BrandLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="gradient-bg flex size-8 items-center justify-center rounded-lg">
        <Bot className="size-4.5 text-white" />
      </div>
      <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
        Agent-X
      </span>
    </div>
  );
}

function NavLinks({ onNavigate }: { readonly onNavigate?: () => void }) {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map(item => {
        const isActive =
          location.pathname === item.href ||
          location.pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer',
              isActive
                ? 'bg-sidebar-primary/15 text-sidebar-primary-foreground shadow-sm'
                : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
            )}
          >
            <Icon
              className={cn(
                'size-4 shrink-0',
                isActive && 'text-sidebar-primary'
              )}
            />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}

function UserSection() {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  const displayName = user?.name ?? user?.email ?? 'User';
  const initials = getInitials(
    user?.name ?? undefined,
    user?.email ?? undefined
  );

  return (
    <div className="px-3 pb-4">
      <div className="border-sidebar-border/50 mb-4 border-t" />
      <div className="flex items-center gap-3">
        <Avatar className="size-8">
          <AvatarFallback className="gradient-bg text-xs font-semibold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 truncate">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {displayName}
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground size-8"
              aria-label={t('auth.signOut')}
            >
              <LogOut className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('auth.signOut')}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

function DesktopSidebar() {
  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-64 shrink-0 border-r md:flex md:flex-col">
      <div className="flex h-14 items-center justify-between px-5">
        <Link to="/">
          <BrandLogo />
        </Link>
        <ThemeToggle />
      </div>
      <div className="border-sidebar-border/50 mx-3 border-t" />
      <ScrollArea className="flex-1 py-4">
        <NavLinks />
      </ScrollArea>
      <UserSection />
    </aside>
  );
}

function MobileSidebar({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="bg-sidebar text-sidebar-foreground w-64 p-0"
      >
        <SheetHeader className="h-14 flex-row items-center px-5">
          <SheetTitle>
            <BrandLogo />
          </SheetTitle>
        </SheetHeader>
        <div className="border-sidebar-border/50 mx-3 border-t" />
        <ScrollArea className="flex-1 py-4">
          <NavLinks onNavigate={() => onOpenChange(false)} />
        </ScrollArea>
        <UserSection />
      </SheetContent>
    </Sheet>
  );
}

export default function DashboardLayout() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <DesktopSidebar />
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="bg-background/80 border-b backdrop-blur-sm md:hidden">
          <div className="flex h-14 items-center gap-4 px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              aria-label={t('nav.openMenu')}
            >
              <Menu className="size-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="gradient-bg flex size-6 items-center justify-center rounded-md">
                <Bot className="size-3.5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Agent-X</span>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col overflow-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

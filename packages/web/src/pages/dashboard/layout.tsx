import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import {
  Bot,
  Database,
  Key,
  LogOut,
  Menu,
  Server,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Providers', href: '/providers', icon: Database },
  { label: 'Agents', href: '/agents', icon: Bot },
  { label: 'MCP Servers', href: '/mcp-servers', icon: Server },
  { label: 'Skills', href: '/skills', icon: Sparkles },
  { label: 'API Keys', href: '/api-keys', icon: Key },
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

function NavLinks({ onNavigate }: { readonly onNavigate?: () => void }) {
  const location = useLocation();

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
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserSection() {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  const displayName = user?.name ?? user?.email ?? 'User';
  const initials = getInitials(
    user?.name ?? undefined,
    user?.email ?? undefined
  );

  return (
    <div className="px-3 pb-4">
      <Separator className="mb-4" />
      <div className="flex items-center gap-3">
        <Avatar className="size-8">
          <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 truncate">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {displayName}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground size-8"
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function DesktopSidebar() {
  return (
    <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border hidden w-64 shrink-0 border-r md:flex md:flex-col">
      <div className="flex h-14 items-center px-6">
        <Link
          to="/"
          className="text-lg font-bold tracking-tight text-sidebar-foreground"
        >
          Agent-X
        </Link>
      </div>
      <Separator />
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
        <SheetHeader className="h-14 justify-center px-6">
          <SheetTitle className="text-lg font-bold tracking-tight text-sidebar-foreground">
            Agent-X
          </SheetTitle>
        </SheetHeader>
        <Separator />
        <ScrollArea className="flex-1 py-4">
          <NavLinks onNavigate={() => onOpenChange(false)} />
        </ScrollArea>
        <UserSection />
      </SheetContent>
    </Sheet>
  );
}

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <DesktopSidebar />
      <MobileSidebar open={mobileOpen} onOpenChange={setMobileOpen} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="bg-background border-b md:hidden">
          <div className="flex h-14 items-center gap-4 px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
            <span className="text-lg font-bold tracking-tight">Agent-X</span>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

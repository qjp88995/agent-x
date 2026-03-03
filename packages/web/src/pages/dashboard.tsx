import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';

export default function DashboardPage() {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">
        Dashboard - Welcome {user?.name ?? user?.email ?? 'User'}
      </h1>
      <Button variant="outline" onClick={logout}>
        Sign out
      </Button>
    </div>
  );
}

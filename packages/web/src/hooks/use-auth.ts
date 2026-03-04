import { UserRole } from '@agent-x/shared';

import { useAuthStore } from '@/stores/auth-store';

export function useIsAdmin(): boolean {
  const role = useAuthStore(s => s.user?.role);
  return role === UserRole.ADMIN;
}

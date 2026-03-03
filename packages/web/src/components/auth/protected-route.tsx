import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/stores/auth-store';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isLoading = useAuthStore(s => s.isLoading);
  const checkAuth = useAuthStore(s => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

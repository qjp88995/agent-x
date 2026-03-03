import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router';
import { ProtectedRoute } from '@/components/auth/protected-route';

const LoginPage = lazy(() => import('@/pages/login'));
const RegisterPage = lazy(() => import('@/pages/register'));
const DashboardPage = lazy(() => import('@/pages/dashboard'));

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-muted-foreground text-sm">Loading...</div>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import { ProtectedRoute } from "@/components/auth/protected-route";

const LoginPage = lazy(() => import("@/pages/login"));
const RegisterPage = lazy(() => import("@/pages/register"));
const DashboardLayout = lazy(() => import("@/pages/dashboard/layout"));
const ProviderListPage = lazy(
  () => import("@/pages/dashboard/providers/index"),
);
const CreateProviderPage = lazy(
  () => import("@/pages/dashboard/providers/create"),
);
const AgentListPage = lazy(() => import("@/pages/dashboard/agents/index"));
const CreateAgentPage = lazy(() => import("@/pages/dashboard/agents/create"));
const EditAgentPage = lazy(() => import("@/pages/dashboard/agents/edit"));

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
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="/providers" replace />} />
            <Route path="/providers" element={<ProviderListPage />} />
            <Route path="/providers/new" element={<CreateProviderPage />} />
            <Route
              path="/providers/:id/edit"
              element={<CreateProviderPage />}
            />
            <Route path="/agents" element={<AgentListPage />} />
            <Route path="/agents/new" element={<CreateAgentPage />} />
            <Route path="/agents/:id/edit" element={<EditAgentPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}

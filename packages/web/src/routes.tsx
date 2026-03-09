import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';

import { ProtectedRoute } from '@/components/auth/protected-route';

const LoginPage = lazy(() => import('@/pages/login'));
const RegisterPage = lazy(() => import('@/pages/register'));
const DashboardLayout = lazy(() => import('@/pages/dashboard/layout'));
const ProviderListPage = lazy(
  () => import('@/pages/dashboard/providers/index')
);
const CreateProviderPage = lazy(
  () => import('@/pages/dashboard/providers/create')
);
const AgentListPage = lazy(() => import('@/pages/dashboard/agents/index'));
const CreateAgentPage = lazy(() => import('@/pages/dashboard/agents/create'));
const EditAgentPage = lazy(() => import('@/pages/dashboard/agents/edit'));
const SkillsPage = lazy(() => import('@/pages/dashboard/skills/index'));
const SkillEditorPage = lazy(() => import('@/pages/dashboard/skills/editor'));
const McpPage = lazy(() => import('@/pages/dashboard/mcp/index'));
const McpEditorPage = lazy(() => import('@/pages/dashboard/mcp/editor'));
const ApiKeysPage = lazy(() => import('@/pages/dashboard/api-keys/index'));
const SettingsPage = lazy(() => import('@/pages/dashboard/settings'));
const ChatPage = lazy(() => import('@/pages/chat/index'));
const WorkspacePage = lazy(() => import('@/pages/chat/workspace'));
const SharedChatPage = lazy(() => import('@/pages/shared/index'));
const SharedWorkspacePage = lazy(() => import('@/pages/shared/workspace'));

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
        <Route path="/s/:token" element={<SharedChatPage />} />
        <Route
          path="/s/:token/workspace/:conversationId"
          element={<SharedWorkspacePage />}
        />
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
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/skills/new" element={<SkillEditorPage />} />
            <Route path="/skills/:id/edit" element={<SkillEditorPage />} />
            <Route path="/mcp-servers" element={<McpPage />} />
            <Route path="/mcp-servers/new" element={<McpEditorPage />} />
            <Route path="/mcp-servers/:id/edit" element={<McpEditorPage />} />
            <Route path="/api-keys" element={<ApiKeysPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="/chat" element={<ChatPage />} />
          <Route
            path="/chat/:conversationId/workspace"
            element={<WorkspacePage />}
          />
        </Route>
        <Route
          path="*"
          element={
            <div className="flex min-h-screen flex-col items-center justify-center gap-4">
              <h1 className="text-4xl font-bold">404</h1>
              <p className="text-muted-foreground">Page not found</p>
              <a href="/" className="text-primary text-sm underline">
                Go to homepage
              </a>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
}

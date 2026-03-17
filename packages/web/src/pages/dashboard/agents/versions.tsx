import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router';

import { Button, PageHeader } from '@agent-x/design';
import { ArrowLeft } from 'lucide-react';

import { VersionList } from '@/components/agents/version-list';
import { LoadingState, NotFoundState } from '@/components/shared/status-states';
import { useAgent } from '@/hooks/use-agents';

export default function AgentVersionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: agent, isLoading, error } = useAgent(id);

  if (!id) {
    return <Navigate to="/agents" replace />;
  }

  if (isLoading) {
    return <LoadingState message={t('agents.loadingAgent')} />;
  }

  if (error || !agent) {
    return (
      <NotFoundState
        title={t('agents.notFound')}
        description={t('agents.notFoundDesc')}
        backLabel={t('agents.backToAgents')}
        backTo="/agents"
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        leading={
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="size-3.5" />
          </Button>
        }
        title={t('agents.versionManagement')}
        description={agent.name}
      />

      <div className="flex-1 overflow-auto p-5">
        <div className="max-w-4xl">
          <VersionList agentId={id} />
        </div>
      </div>
    </div>
  );
}

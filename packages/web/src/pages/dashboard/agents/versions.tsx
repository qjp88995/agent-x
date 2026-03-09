import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router';

import { VersionList } from '@/components/agents/version-list';
import { LoadingState, NotFoundState, PageHeader } from '@/components/shared';
import { useAgent } from '@/hooks/use-agents';

export default function AgentVersionsPage() {
  const { t } = useTranslation();
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
    <div className="flex flex-col gap-6">
      <PageHeader
        backTo={-1}
        backLabel={t('common.back')}
        title={t('agents.versionManagement')}
        description={t('agents.versionManagementDesc', { name: agent.name })}
      />

      <div className="max-w-4xl">
        <VersionList agentId={id} />
      </div>
    </div>
  );
}

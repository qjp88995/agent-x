import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router';

import { ConversationsTab } from '@/components/agents/conversations-tab';
import { ShareLinksTab } from '@/components/agents/share-links-tab';
import { VersionList } from '@/components/agents/version-list';
import { LoadingState, NotFoundState, PageHeader } from '@/components/shared';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        backTo={`/agents/${id}/edit`}
        backLabel={t('agents.backToEdit')}
        title={t('agents.versionManagement')}
        description={t('agents.versionManagementDesc', { name: agent.name })}
      />

      <Tabs defaultValue="versions" className="flex min-h-0 flex-1 flex-col">
        <TabsList>
          <TabsTrigger value="versions">{t('agents.versions')}</TabsTrigger>
          <TabsTrigger value="share-links">
            {t('agents.shareLinks')}
          </TabsTrigger>
          <TabsTrigger value="conversations">
            {t('agents.conversations')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="versions">
          <Card className="max-w-4xl">
            <CardHeader>
              <CardTitle>{t('agents.publishedVersions')}</CardTitle>
              <CardDescription>
                {t('agents.publishedVersionsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VersionList agentId={id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="share-links">
          <ShareLinksTab agentId={id} />
        </TabsContent>

        <TabsContent value="conversations">
          <ConversationsTab agentId={id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

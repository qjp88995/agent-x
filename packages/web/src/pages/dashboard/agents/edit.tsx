import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router';

import {
  Badge,
  Button,
  ErrorState,
  Form,
  LoadingState,
  PageHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@agent-x/design';
import type {
  AgentResponse,
  AgentStatus as AgentStatusType,
  ProviderResponse,
} from '@agent-x/shared';
import { AgentStatus } from '@agent-x/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  GitBranch,
  Loader2,
  Rocket,
} from 'lucide-react';
import { toast } from 'sonner';

import { AgentBasicInfoTab } from '@/components/agents/agent-basic-info-tab';
import { AgentMcpTab } from '@/components/agents/agent-mcp-tab';
import { AgentPromptTab } from '@/components/agents/agent-prompt-tab';
import { ArchiveAgentDialog } from '@/components/agents/archive-agent-dialog';
import { PublishVersionDialog } from '@/components/agents/publish-version-dialog';
import { TestChatPanel } from '@/components/agents/test-chat-panel';
import { usePublishVersion } from '@/hooks/use-agent-versions';
import {
  useAgent,
  useArchiveAgent,
  useUnarchiveAgent,
  useUpdateAgent,
} from '@/hooks/use-agents';
import { useProviders } from '@/hooks/use-providers';
import { type AgentFormValues, agentSchema } from '@/lib/schemas';
import { cn } from '@/lib/utils';

const STATUS_BADGE_CONFIG: Record<
  AgentStatusType,
  { labelKey: string; className: string }
> = {
  ACTIVE: {
    labelKey: 'agents.active',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  ARCHIVED: {
    labelKey: 'agents.archived',
    className:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  },
};

export default function EditAgentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const {
    data: agent,
    isLoading: isLoadingAgent,
    error: agentError,
  } = useAgent(id);
  const { data: providers, isLoading: isLoadingProviders } = useProviders();

  if (!id) {
    return <Navigate to="/agents" replace />;
  }

  if (isLoadingAgent || isLoadingProviders) {
    return <LoadingState message={t('agents.loadingAgent')} />;
  }

  if (agentError || !agent) {
    return (
      <ErrorState
        title={t('agents.notFound')}
        description={t('agents.notFoundDesc')}
        actionLabel={t('agents.backToAgents')}
        onAction={() => navigate('/agents')}
      />
    );
  }

  return (
    <AgentEditForm agentId={id} agent={agent} providers={providers ?? []} />
  );
}

function AgentEditForm({
  agentId,
  agent,
  providers,
}: {
  agentId: string;
  agent: AgentResponse;
  providers: ProviderResponse[];
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const updateAgent = useUpdateAgent();
  const publishVersion = usePublishVersion();
  const archiveAgent = useArchiveAgent();
  const unarchiveAgent = useUnarchiveAgent();

  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [changelog, setChangelog] = useState('');

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: agent.name,
      description: agent.description ?? '',
      providerId: agent.providerId,
      modelId: agent.modelId,
      systemPrompt: agent.systemPrompt,
      temperature: agent.temperature,
      maxTokens: agent.maxTokens,
      thinkingEnabled: agent.thinkingEnabled,
    },
    mode: 'onChange',
  });

  const activeProviders = useMemo(
    () => providers.filter(p => p.isActive),
    [providers]
  );

  const watchedProviderId = form.watch('providerId');

  const selectedProvider = useMemo(
    () => activeProviders.find(p => p.id === watchedProviderId),
    [activeProviders, watchedProviderId]
  );

  const activeModels = useMemo(
    () => selectedProvider?.models.filter(m => m.isActive) ?? [],
    [selectedProvider]
  );

  const isSaving = updateAgent.isPending;
  const isPublishing = publishVersion.isPending;
  const isArchiving = archiveAgent.isPending;
  const isUnarchiving = unarchiveAgent.isPending;
  const isBusy = isSaving || isPublishing || isArchiving || isUnarchiving;

  async function onSubmit(values: AgentFormValues) {
    if (isBusy) return;

    try {
      await updateAgent.mutateAsync({
        id: agentId,
        dto: {
          name: values.name.trim(),
          description: values.description?.trim() || undefined,
          providerId: values.providerId,
          modelId: values.modelId,
          systemPrompt: values.systemPrompt.trim(),
          temperature: values.temperature,
          maxTokens: values.maxTokens,
          thinkingEnabled: values.thinkingEnabled,
        },
      });
      toast.success(t('agents.updated'));
    } catch {
      toast.error(t('agents.updateFailed'));
    }
  }

  async function handlePublishVersion() {
    if (isBusy) return;

    try {
      await publishVersion.mutateAsync({
        agentId,
        dto: { changelog: changelog.trim() || undefined },
      });
      setPublishDialogOpen(false);
      setChangelog('');
      toast.success(t('agents.published'));
    } catch {
      toast.error(t('agents.publishFailed'));
    }
  }

  async function handleArchiveConfirm() {
    if (isBusy) return;

    try {
      await archiveAgent.mutateAsync(agentId);
      setArchiveDialogOpen(false);
      toast.success(t('agents.archiveSuccess'));
    } catch {
      toast.error(t('agents.archiveFailed'));
    }
  }

  async function handleUnarchive() {
    if (isBusy) return;

    try {
      await unarchiveAgent.mutateAsync(agentId);
      toast.success(t('agents.unarchiveSuccess'));
    } catch {
      toast.error(t('agents.unarchiveFailed'));
    }
  }

  const statusConfig = STATUS_BADGE_CONFIG[agent.status];

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        leading={
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => navigate('/agents')}
            aria-label={t('agents.backToAgents')}
          >
            <ArrowLeft className="size-3.5" />
          </Button>
        }
        title={t('agents.editAgent')}
        actions={
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn('border-0', statusConfig.className)}
            >
              {t(statusConfig.labelKey)}
            </Badge>
            {agent.latestVersion !== null && (
              <span className="text-foreground-muted text-xs">
                v{agent.latestVersion}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/agents/${agentId}/versions`)}
            >
              <GitBranch className="mr-2 size-3.5" />
              {t('agents.versionManagement')}
            </Button>
            {agent.status === AgentStatus.ACTIVE && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setArchiveDialogOpen(true)}
                  disabled={isBusy}
                >
                  {isArchiving && (
                    <Loader2 className="mr-2 size-3.5 animate-spin" />
                  )}
                  <Archive className="mr-2 size-3.5" />
                  {t('agents.archive')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setPublishDialogOpen(true)}
                  disabled={isBusy}
                  variant="primary"
                >
                  <Rocket className="mr-2 size-3.5" />
                  {t('agents.publishVersion')}
                </Button>
              </>
            )}
            {agent.status === AgentStatus.ARCHIVED && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnarchive}
                disabled={isBusy}
              >
                {isUnarchiving && (
                  <Loader2 className="mr-2 size-3.5 animate-spin" />
                )}
                <ArchiveRestore className="mr-2 size-3.5" />
                {t('agents.unarchive')}
              </Button>
            )}
          </div>
        }
      />

      <div className="flex min-h-0 flex-1">
        <div className="flex flex-1 flex-col overflow-auto p-5">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <Tabs
                defaultValue="basic"
                className="flex min-h-0 flex-1 flex-col gap-6"
              >
                <TabsList>
                  <TabsTrigger value="basic">
                    {t('agents.basicInfo')}
                  </TabsTrigger>
                  <TabsTrigger value="prompt">
                    {t('agents.systemPrompt')}
                  </TabsTrigger>
                  <TabsTrigger value="mcp">
                    {t('agents.mcpServers')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="basic"
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <AgentBasicInfoTab
                    form={form}
                    activeProviders={activeProviders}
                    activeModels={activeModels}
                    watchedProviderId={watchedProviderId}
                    isBusy={isBusy}
                    isSaving={isSaving}
                    systemPrompt={form.watch('systemPrompt')}
                  />
                </TabsContent>

                <TabsContent
                  value="prompt"
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <AgentPromptTab
                    form={form}
                    isBusy={isBusy}
                    isSaving={isSaving}
                  />
                </TabsContent>

                <TabsContent
                  value="mcp"
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <AgentMcpTab
                    agentId={agentId}
                    currentMcpServers={agent.mcpServers}
                  />
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </div>

        {agent.status === AgentStatus.ACTIVE && (
          <TestChatPanel agentId={agentId} className="hidden lg:flex" />
        )}
      </div>

      <PublishVersionDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        changelog={changelog}
        onChangelogChange={setChangelog}
        onPublish={handlePublishVersion}
        isPublishing={isPublishing}
      />

      <ArchiveAgentDialog
        open={archiveDialogOpen}
        onOpenChange={setArchiveDialogOpen}
        agentName={agent.name}
        onConfirm={handleArchiveConfirm}
        isArchiving={archiveAgent.isPending}
      />
    </div>
  );
}

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router';

import type { AgentStatus as AgentStatusType } from '@agent-x/shared';
import { AgentStatus } from '@agent-x/shared';
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Loader2,
  Rocket,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

import { AgentMcpTab } from '@/components/agents/agent-mcp-tab';
import { ConversationsTab } from '@/components/agents/conversations-tab';
import { ShareLinksTab } from '@/components/agents/share-links-tab';
import { TestChatPanel } from '@/components/agents/test-chat-panel';
import { VersionList } from '@/components/agents/version-list';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { usePublishVersion } from '@/hooks/use-agent-versions';
import {
  useAgent,
  useArchiveAgent,
  useUnarchiveAgent,
  useUpdateAgent,
} from '@/hooks/use-agents';
import { useProviders } from '@/hooks/use-providers';
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
  const updateAgent = useUpdateAgent();
  const publishVersion = usePublishVersion();
  const archiveAgent = useArchiveAgent();
  const unarchiveAgent = useUnarchiveAgent();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [providerId, setProviderId] = useState('');
  const [modelId, setModelId] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState('0.7');
  const [maxTokens, setMaxTokens] = useState('4096');
  const [error, setError] = useState<string | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [changelog, setChangelog] = useState('');

  const activeProviders = useMemo(
    () => providers?.filter(p => p.isActive) ?? [],
    [providers]
  );

  const selectedProvider = useMemo(
    () => activeProviders.find(p => p.id === providerId),
    [activeProviders, providerId]
  );

  const activeModels = useMemo(
    () => selectedProvider?.models.filter(m => m.isActive) ?? [],
    [selectedProvider]
  );

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setDescription(agent.description ?? '');
      setProviderId(agent.providerId);
      setModelId(agent.modelId);
      setSystemPrompt(agent.systemPrompt);
      setTemperature(String(agent.temperature));
      setMaxTokens(String(agent.maxTokens));
    }
  }, [agent]);

  function handleProviderChange(newProviderId: string) {
    setProviderId(newProviderId);
    setModelId('');
  }

  const isFormValid =
    name.trim().length > 0 &&
    providerId.length > 0 &&
    modelId.length > 0 &&
    systemPrompt.trim().length > 0;

  const isSaving = updateAgent.isPending;
  const isPublishing = publishVersion.isPending;
  const isArchiving = archiveAgent.isPending;
  const isUnarchiving = unarchiveAgent.isPending;
  const isBusy = isSaving || isPublishing || isArchiving || isUnarchiving;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isFormValid || isBusy || !id) return;
    setError(null);

    const parsedTemperature = parseFloat(temperature);
    const parsedMaxTokens = parseInt(maxTokens, 10);

    if (
      isNaN(parsedTemperature) ||
      parsedTemperature < 0 ||
      parsedTemperature > 2
    ) {
      setError(t('agents.tempError'));
      return;
    }

    if (isNaN(parsedMaxTokens) || parsedMaxTokens < 1) {
      setError(t('agents.maxTokensError'));
      return;
    }

    try {
      await updateAgent.mutateAsync({
        id,
        dto: {
          name: name.trim(),
          description: description.trim() || undefined,
          providerId,
          modelId,
          systemPrompt: systemPrompt.trim(),
          temperature: parsedTemperature,
          maxTokens: parsedMaxTokens,
        },
      });
      toast.success(t('agents.updated'));
    } catch {
      toast.error(t('agents.updateFailed'));
    }
  }

  async function handlePublishVersion() {
    if (!id || isBusy) return;
    setError(null);

    try {
      await publishVersion.mutateAsync({
        agentId: id,
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
    if (!id || isBusy) return;
    setError(null);

    try {
      await archiveAgent.mutateAsync(id);
      setArchiveDialogOpen(false);
      toast.success(t('agents.archiveSuccess'));
    } catch {
      toast.error(t('agents.archiveFailed'));
    }
  }

  async function handleUnarchive() {
    if (!id || isBusy) return;
    setError(null);

    try {
      await unarchiveAgent.mutateAsync(id);
      toast.success(t('agents.unarchiveSuccess'));
    } catch {
      toast.error(t('agents.unarchiveFailed'));
    }
  }

  if (!id) {
    return <Navigate to="/agents" replace />;
  }

  if (isLoadingAgent) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground text-sm">
          {t('agents.loadingAgent')}
        </div>
      </div>
    );
  }

  if (agentError || !agent) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">{t('agents.notFound')}</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          {t('agents.notFoundDesc')}
        </p>
        <Button variant="outline" onClick={() => navigate('/agents')}>
          {t('agents.backToAgents')}
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_BADGE_CONFIG[agent.status];

  return (
    <div className="-m-6 flex min-h-0 flex-1">
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/agents')}
              aria-label="Back to agents"
              className="cursor-pointer"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {t('agents.editAgent')}
                </h1>
                <Badge
                  variant="outline"
                  className={cn('border-0', statusConfig.className)}
                >
                  {t(statusConfig.labelKey)}
                </Badge>
                {agent.latestVersion !== null && (
                  <span className="text-muted-foreground text-sm">
                    v{agent.latestVersion}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                {t('agents.editAgentDesc')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {agent.status === AgentStatus.ACTIVE && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setArchiveDialogOpen(true)}
                  disabled={isBusy}
                >
                  {isArchiving && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  <Archive className="mr-2 size-4" />
                  {t('agents.archive')}
                </Button>
                <Button
                  onClick={() => setPublishDialogOpen(true)}
                  disabled={isBusy}
                  className="gradient-bg text-white hover:opacity-90 cursor-pointer"
                >
                  <Rocket className="mr-2 size-4" />
                  {t('agents.publishVersion')}
                </Button>
              </>
            )}
            {agent.status === AgentStatus.ARCHIVED && (
              <Button
                variant="outline"
                onClick={handleUnarchive}
                disabled={isBusy}
              >
                {isUnarchiving && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                <ArchiveRestore className="mr-2 size-4" />
                {t('agents.unarchive')}
              </Button>
            )}
          </div>
        </div>

        {/* Publish Version Dialog */}
        <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('agents.publishNewVersion')}</DialogTitle>
              <DialogDescription>{t('agents.publishDesc')}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label htmlFor="changelog">{t('agents.changelog')}</Label>
              <Textarea
                id="changelog"
                placeholder={t('agents.changelogPlaceholder')}
                value={changelog}
                onChange={e => setChangelog(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPublishDialogOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handlePublishVersion}
                disabled={isPublishing}
                className="gradient-bg text-white hover:opacity-90 cursor-pointer"
              >
                {isPublishing && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {t('agents.publish')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Feedback messages */}
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {/* Tabbed form */}
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic">
            <TabsList>
              <TabsTrigger value="basic">{t('agents.basicInfo')}</TabsTrigger>
              <TabsTrigger value="prompt">
                {t('agents.systemPrompt')}
              </TabsTrigger>
              <TabsTrigger value="mcp">{t('agents.mcpServers')}</TabsTrigger>
              <TabsTrigger value="versions">{t('agents.versions')}</TabsTrigger>
              <TabsTrigger value="share-links">
                {t('agents.shareLinks')}
              </TabsTrigger>
              <TabsTrigger value="conversations">
                {t('agents.conversations')}
              </TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic">
              <Card className="max-w-4xl">
                <CardHeader>
                  <CardTitle>{t('agents.basicInfoTitle')}</CardTitle>
                  <CardDescription>{t('agents.basicInfoDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-6">
                  {/* Name */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name">{t('common.name')}</Label>
                    <Input
                      id="name"
                      placeholder={t('agents.namePlaceholder')}
                      value={name}
                      onChange={e => setName(e.target.value)}
                      disabled={isBusy}
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="description">
                      {t('common.description')}
                    </Label>
                    <Textarea
                      id="description"
                      placeholder={t('agents.descPlaceholder')}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      disabled={isBusy}
                      rows={3}
                    />
                  </div>

                  {/* Provider */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="provider">{t('agents.provider')}</Label>
                    <select
                      id="provider"
                      value={providerId}
                      onChange={e => handleProviderChange(e.target.value)}
                      disabled={isBusy || isLoadingProviders}
                      className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-0.75 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">
                        {isLoadingProviders
                          ? t('agents.loadingProviders')
                          : t('agents.selectProvider')}
                      </option>
                      {activeProviders.map(provider => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Model */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="model">{t('agents.model')}</Label>
                    <select
                      id="model"
                      value={modelId}
                      onChange={e => setModelId(e.target.value)}
                      disabled={isBusy || !providerId}
                      className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-0.75 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">
                        {!providerId
                          ? t('agents.selectProviderFirst')
                          : t('agents.selectModel')}
                      </option>
                      {activeModels.map(model => (
                        <option key={model.id} value={model.modelId}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Temperature */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="temperature">
                      {t('agents.temperature')}{' '}
                      <span className="text-muted-foreground font-normal">
                        ({temperature})
                      </span>
                    </Label>
                    <div className="flex items-center gap-4">
                      <input
                        id="temperature"
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={temperature}
                        onChange={e => setTemperature(e.target.value)}
                        disabled={isBusy}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={temperature}
                        onChange={e => setTemperature(e.target.value)}
                        disabled={isBusy}
                        className="w-20"
                      />
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {t('agents.temperatureHint')}
                    </p>
                  </div>

                  {/* Max Tokens */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="maxTokens">{t('agents.maxTokens')}</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      min="1"
                      placeholder={t('agents.maxTokensPlaceholder')}
                      value={maxTokens}
                      onChange={e => setMaxTokens(e.target.value)}
                      disabled={isBusy}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex max-w-4xl justify-end gap-3 border-t pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/agents')}
                  disabled={isBusy}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={!isFormValid || isBusy}
                  className="gradient-bg text-white hover:opacity-90 cursor-pointer"
                >
                  {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                  <Save className="mr-2 size-4" />
                  {t('common.save')}
                </Button>
              </div>
            </TabsContent>

            {/* System Prompt Tab */}
            <TabsContent value="prompt">
              <Card className="max-w-4xl">
                <CardHeader>
                  <CardTitle>{t('agents.systemPrompt')}</CardTitle>
                  <CardDescription>
                    {t('agents.systemPromptDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder={t('agents.systemPromptPlaceholder')}
                    value={systemPrompt}
                    onChange={e => setSystemPrompt(e.target.value)}
                    disabled={isBusy}
                    required
                    rows={20}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>

              <div className="flex max-w-4xl justify-end gap-3 border-t pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/agents')}
                  disabled={isBusy}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={!isFormValid || isBusy}
                  className="gradient-bg text-white hover:opacity-90 cursor-pointer"
                >
                  {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                  <Save className="mr-2 size-4" />
                  {t('common.save')}
                </Button>
              </div>
            </TabsContent>

            {/* MCP Servers Tab */}
            <TabsContent value="mcp">
              <AgentMcpTab agentId={id} currentMcpServers={agent.mcpServers} />
            </TabsContent>

            {/* Versions Tab */}
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

            {/* Share Links Tab */}
            <TabsContent value="share-links">
              <ShareLinksTab agentId={id} />
            </TabsContent>

            {/* Conversations Tab */}
            <TabsContent value="conversations">
              <ConversationsTab agentId={id} />
            </TabsContent>
          </Tabs>
        </form>
      </div>

      {/* Test Chat Panel */}
      {agent.status === AgentStatus.ACTIVE && <TestChatPanel agentId={id} />}

      {/* Archive confirmation dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('agents.archiveAgent')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('agents.archiveConfirm', { name: agent.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveConfirm}
              disabled={archiveAgent.isPending}
            >
              {t('agents.archive')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

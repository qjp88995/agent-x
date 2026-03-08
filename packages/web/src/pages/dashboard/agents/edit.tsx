import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router';

import type {
  AgentResponse,
  AgentStatus as AgentStatusType,
  ProviderResponse,
} from '@agent-x/shared';
import { AgentStatus } from '@agent-x/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { Archive, ArchiveRestore, Loader2, Rocket, Save } from 'lucide-react';
import { toast } from 'sonner';

import { AgentMcpTab } from '@/components/agents/agent-mcp-tab';
import { ConversationsTab } from '@/components/agents/conversations-tab';
import { ShareLinksTab } from '@/components/agents/share-links-tab';
import { TestChatPanel } from '@/components/agents/test-chat-panel';
import { VersionList } from '@/components/agents/version-list';
import {
  FormFooter,
  LoadingState,
  NotFoundState,
  PageHeader,
  PromptEditor,
} from '@/components/shared';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
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

/** Outer shell: fetch data, show loading / not-found, then render the form. */
export default function EditAgentPage() {
  const { t } = useTranslation();
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
      <NotFoundState
        title={t('agents.notFound')}
        description={t('agents.notFoundDesc')}
        backLabel={t('agents.backToAgents')}
        backTo="/agents"
      />
    );
  }

  return (
    <AgentEditForm agentId={id} agent={agent} providers={providers ?? []} />
  );
}

/** Inner form: mounts only when agent + providers are ready. */
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
    <div className="-m-6 flex min-h-0 flex-1">
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
        {/* Header */}
        <PageHeader
          backTo="/agents"
          backLabel={t('agents.backToAgents')}
          title={t('agents.editAgent')}
          description={t('agents.editAgentDesc')}
          titleExtra={
            <>
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
            </>
          }
        >
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
                  className="gradient-bg cursor-pointer text-white hover:opacity-90"
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
        </PageHeader>

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
                className="gradient-bg cursor-pointer text-white hover:opacity-90"
              >
                {isPublishing && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {t('agents.publish')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tabbed form */}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <Tabs defaultValue="basic" className="flex min-h-0 flex-1 flex-col">
              <TabsList>
                <TabsTrigger value="basic">{t('agents.basicInfo')}</TabsTrigger>
                <TabsTrigger value="prompt">
                  {t('agents.systemPrompt')}
                </TabsTrigger>
                <TabsTrigger value="mcp">{t('agents.mcpServers')}</TabsTrigger>
                <TabsTrigger value="versions">
                  {t('agents.versions')}
                </TabsTrigger>
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
                    <CardDescription>
                      {t('agents.basicInfoDesc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-6">
                    {/* Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.name')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('agents.namePlaceholder')}
                              disabled={isBusy}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Description */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('common.description')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('agents.descPlaceholder')}
                              disabled={isBusy}
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Provider */}
                    <FormField
                      control={form.control}
                      name="providerId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('agents.provider')}</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={v => {
                              field.onChange(v);
                              form.setValue('modelId', '');
                            }}
                            disabled={isBusy}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue
                                  placeholder={t('agents.selectProvider')}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {activeProviders.map(provider => (
                                <SelectItem
                                  key={provider.id}
                                  value={provider.id}
                                >
                                  {provider.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Model */}
                    <FormField
                      control={form.control}
                      name="modelId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('agents.model')}</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={isBusy || !watchedProviderId}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue
                                  placeholder={
                                    !watchedProviderId
                                      ? t('agents.selectProviderFirst')
                                      : t('agents.selectModel')
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {activeModels.map(model => (
                                <SelectItem
                                  key={model.id}
                                  value={model.modelId}
                                >
                                  {model.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Temperature */}
                    <FormField
                      control={form.control}
                      name="temperature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('agents.temperature')}{' '}
                            <span className="text-muted-foreground font-normal">
                              ({field.value})
                            </span>
                          </FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-4">
                              <Slider
                                min={0}
                                max={2}
                                step={0.1}
                                value={[field.value]}
                                onValueChange={([v]) => field.onChange(v)}
                                disabled={isBusy}
                                className="flex-1"
                              />
                              <Input
                                type="number"
                                min="0"
                                max="2"
                                step="0.1"
                                value={field.value}
                                onChange={e =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                disabled={isBusy}
                                className="w-20"
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            {t('agents.temperatureHint')}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Max Tokens */}
                    <FormField
                      control={form.control}
                      name="maxTokens"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('agents.maxTokens')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder={t('agents.maxTokensPlaceholder')}
                              value={field.value}
                              onChange={e =>
                                field.onChange(
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              disabled={isBusy}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <FormFooter
                  onCancel={() => navigate('/agents')}
                  isSaving={isSaving}
                  disabled={!form.formState.isValid}
                  submitLabel={t('common.save')}
                  cancelLabel={t('common.cancel')}
                  maxWidth="max-w-4xl"
                  icon={<Save className="mr-2 size-4" />}
                />
              </TabsContent>

              {/* System Prompt Tab */}
              <TabsContent
                value="prompt"
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="flex min-h-0 max-w-4xl flex-1 flex-col gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {t('agents.systemPrompt')}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {t('agents.systemPromptDesc')}
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="systemPrompt"
                    render={({ field }) => (
                      <FormItem className="flex min-h-0 flex-1 flex-col">
                        <FormControl>
                          <PromptEditor
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={t('agents.systemPromptPlaceholder')}
                            disabled={isBusy}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormFooter
                    onCancel={() => navigate('/agents')}
                    isSaving={isSaving}
                    disabled={!form.formState.isValid}
                    submitLabel={t('common.save')}
                    cancelLabel={t('common.cancel')}
                    icon={<Save className="mr-2 size-4" />}
                  />
                </div>
              </TabsContent>

              {/* MCP Servers Tab */}
              <TabsContent value="mcp">
                <AgentMcpTab
                  agentId={agentId}
                  currentMcpServers={agent.mcpServers}
                />
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
                    <VersionList agentId={agentId} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Share Links Tab */}
              <TabsContent value="share-links">
                <ShareLinksTab agentId={agentId} />
              </TabsContent>

              {/* Conversations Tab */}
              <TabsContent value="conversations">
                <ConversationsTab agentId={agentId} />
              </TabsContent>
            </Tabs>
          </form>
        </Form>
      </div>

      {/* Test Chat Panel */}
      {agent.status === AgentStatus.ACTIVE && (
        <TestChatPanel agentId={agentId} />
      )}

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

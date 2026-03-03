import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Loader2,
  Rocket,
  Save,
} from 'lucide-react';
import { AgentStatus } from '@agent-x/shared';
import type { AgentStatus as AgentStatusType } from '@agent-x/shared';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  useAgent,
  useArchiveAgent,
  usePublishAgent,
  useUpdateAgent,
} from '@/hooks/use-agents';
import { useProviders } from '@/hooks/use-providers';

const STATUS_BADGE_CONFIG: Record<
  AgentStatusType,
  { label: string; className: string }
> = {
  DRAFT: {
    label: 'Draft',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  PUBLISHED: {
    label: 'Published',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  ARCHIVED: {
    label: 'Archived',
    className:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  },
};

export default function EditAgentPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const {
    data: agent,
    isLoading: isLoadingAgent,
    error: agentError,
  } = useAgent(id);
  const { data: providers, isLoading: isLoadingProviders } = useProviders();
  const updateAgent = useUpdateAgent();
  const publishAgent = usePublishAgent();
  const archiveAgent = useArchiveAgent();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [providerId, setProviderId] = useState('');
  const [modelId, setModelId] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState('0.7');
  const [maxTokens, setMaxTokens] = useState('4096');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Pre-fill form when agent data loads
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
  const isPublishing = publishAgent.isPending;
  const isArchiving = archiveAgent.isPending;
  const isBusy = isSaving || isPublishing || isArchiving;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isFormValid || isBusy || !id) return;
    setError(null);
    setSuccessMessage(null);

    const parsedTemperature = parseFloat(temperature);
    const parsedMaxTokens = parseInt(maxTokens, 10);

    if (
      isNaN(parsedTemperature) ||
      parsedTemperature < 0 ||
      parsedTemperature > 2
    ) {
      setError('Temperature must be a number between 0 and 2.');
      return;
    }

    if (isNaN(parsedMaxTokens) || parsedMaxTokens < 1) {
      setError('Max tokens must be a positive number.');
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
      setSuccessMessage('Agent updated successfully.');
    } catch {
      setError('Failed to update agent. Please try again.');
    }
  }

  async function handlePublish() {
    if (!id || isBusy) return;
    setError(null);
    setSuccessMessage(null);

    try {
      await publishAgent.mutateAsync(id);
      setSuccessMessage('Agent published successfully.');
    } catch {
      setError('Failed to publish agent. Please try again.');
    }
  }

  async function handleArchive() {
    if (!id || isBusy) return;
    setError(null);
    setSuccessMessage(null);

    try {
      await archiveAgent.mutateAsync(id);
      setSuccessMessage('Agent archived successfully.');
    } catch {
      setError('Failed to archive agent. Please try again.');
    }
  }

  if (isLoadingAgent) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground text-sm">Loading agent...</div>
      </div>
    );
  }

  if (agentError || (!isLoadingAgent && !agent)) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">Agent not found</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          The agent you are looking for does not exist.
        </p>
        <Button variant="outline" onClick={() => navigate('/agents')}>
          Back to Agents
        </Button>
      </div>
    );
  }

  const statusConfig = STATUS_BADGE_CONFIG[agent.status];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/agents')}
            aria-label="Back to agents"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Edit Agent</h1>
              <Badge
                variant="outline"
                className={cn('border-0', statusConfig.className)}
              >
                {statusConfig.label}
              </Badge>
              <span className="text-muted-foreground text-sm">
                v{agent.version}
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Update your agent configuration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {agent.status === AgentStatus.DRAFT && (
            <Button variant="outline" onClick={handlePublish} disabled={isBusy}>
              {isPublishing && <Loader2 className="mr-2 size-4 animate-spin" />}
              <Rocket className="mr-2 size-4" />
              Publish
            </Button>
          )}
          {agent.status === AgentStatus.PUBLISHED && (
            <Button variant="outline" onClick={handleArchive} disabled={isBusy}>
              {isArchiving && <Loader2 className="mr-2 size-4 animate-spin" />}
              <Archive className="mr-2 size-4" />
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* Feedback messages */}
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
          {successMessage}
        </div>
      )}

      {/* Tabbed form */}
      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="gap-6">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="prompt">System Prompt</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  General configuration for this agent.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {/* Name */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Customer Support Agent"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={isBusy}
                    required
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this agent does..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    disabled={isBusy}
                    rows={3}
                  />
                </div>

                {/* Provider */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="provider">Provider</Label>
                  <select
                    id="provider"
                    value={providerId}
                    onChange={e => handleProviderChange(e.target.value)}
                    disabled={isBusy || isLoadingProviders}
                    className="border-input bg-background ring-offset-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">
                      {isLoadingProviders
                        ? 'Loading providers...'
                        : 'Select a provider'}
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
                  <Label htmlFor="model">Model</Label>
                  <select
                    id="model"
                    value={modelId}
                    onChange={e => setModelId(e.target.value)}
                    disabled={isBusy || !providerId}
                    className="border-input bg-background ring-offset-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">
                      {!providerId
                        ? 'Select a provider first'
                        : 'Select a model'}
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
                    Temperature{' '}
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
                </div>

                {/* Max Tokens */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="1"
                    placeholder="4096"
                    value={maxTokens}
                    onChange={e => setMaxTokens(e.target.value)}
                    disabled={isBusy}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Prompt Tab */}
          <TabsContent value="prompt">
            <Card className="max-w-4xl">
              <CardHeader>
                <CardTitle>System Prompt</CardTitle>
                <CardDescription>
                  Define the behavior and personality of your agent.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="You are a helpful assistant..."
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  disabled={isBusy}
                  required
                  rows={20}
                  className="font-mono text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Save button - visible in both tabs */}
          <div className="flex max-w-4xl justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/agents')}
              disabled={isBusy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid || isBusy}>
              {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              <Save className="mr-2 size-4" />
              Save Changes
            </Button>
          </div>
        </Tabs>
      </form>
    </div>
  );
}

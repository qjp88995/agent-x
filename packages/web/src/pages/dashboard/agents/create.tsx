import { type FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAgent } from '@/hooks/use-agents';
import { useProviders } from '@/hooks/use-providers';

export default function CreateAgentPage() {
  const navigate = useNavigate();
  const createAgent = useCreateAgent();
  const {
    data: providers,
    isLoading: isLoadingProviders,
    error: providersError,
  } = useProviders();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [providerId, setProviderId] = useState('');
  const [modelId, setModelId] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState('0.7');
  const [maxTokens, setMaxTokens] = useState('4096');
  const [error, setError] = useState<string | null>(null);

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

  function handleProviderChange(newProviderId: string) {
    setProviderId(newProviderId);
    setModelId('');
  }

  const isFormValid =
    name.trim().length > 0 &&
    providerId.length > 0 &&
    modelId.length > 0 &&
    systemPrompt.trim().length > 0;

  const isSaving = createAgent.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isFormValid || isSaving) return;
    setError(null);

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
      await createAgent.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        providerId,
        modelId,
        systemPrompt: systemPrompt.trim(),
        temperature: parsedTemperature,
        maxTokens: parsedMaxTokens,
      });
      await navigate('/agents');
    } catch {
      setError('Failed to create agent. Please try again.');
    }
  }

  if (providersError) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">Failed to load providers</h3>
        <p className="text-muted-foreground text-sm">
          Providers are required to create an agent. Please try refreshing.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
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
          <h1 className="text-2xl font-bold tracking-tight">Create Agent</h1>
          <p className="text-muted-foreground text-sm">
            Configure a new AI agent.
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Agent Configuration</CardTitle>
            <CardDescription>
              Set up the basic configuration for your new agent.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-6">
            {error && (
              <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
                {error}
              </div>
            )}

            {/* Name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., Customer Support Agent"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isSaving}
                required
              />
              <p className="text-muted-foreground text-xs">
                A descriptive name for your agent.
              </p>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this agent does..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isSaving}
                rows={3}
              />
              <p className="text-muted-foreground text-xs">
                Optional description of the agent&apos;s purpose.
              </p>
            </div>

            {/* Provider */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="provider">Provider</Label>
              <select
                id="provider"
                value={providerId}
                onChange={e => handleProviderChange(e.target.value)}
                disabled={isSaving || isLoadingProviders}
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
              <p className="text-muted-foreground text-xs">
                The AI provider to use for this agent.
              </p>
            </div>

            {/* Model */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="model">Model</Label>
              <select
                id="model"
                value={modelId}
                onChange={e => setModelId(e.target.value)}
                disabled={isSaving || !providerId}
                className="border-input bg-background ring-offset-background focus:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {!providerId ? 'Select a provider first' : 'Select a model'}
                </option>
                {activeModels.map(model => (
                  <option key={model.id} value={model.modelId}>
                    {model.name}
                  </option>
                ))}
              </select>
              <p className="text-muted-foreground text-xs">
                The model to use. Available models depend on the selected
                provider.
              </p>
            </div>

            {/* System Prompt */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                placeholder="You are a helpful assistant..."
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                disabled={isSaving}
                required
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-muted-foreground text-xs">
                The system prompt defines the agent&apos;s behavior and
                personality.
              </p>
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
                  disabled={isSaving}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={e => setTemperature(e.target.value)}
                  disabled={isSaving}
                  className="w-20"
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Controls randomness. Lower values are more deterministic, higher
                values are more creative.
              </p>
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
                disabled={isSaving}
              />
              <p className="text-muted-foreground text-xs">
                Maximum number of tokens the model can generate in a response.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/agents')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid || isSaving}>
              {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create Agent
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

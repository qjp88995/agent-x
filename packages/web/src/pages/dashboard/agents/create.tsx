import { type FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
  const { t } = useTranslation();
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
      setError(t('agents.tempError'));
      return;
    }

    if (isNaN(parsedMaxTokens) || parsedMaxTokens < 1) {
      setError(t('agents.maxTokensError'));
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
      toast.success(t('agents.created'));
      await navigate('/agents');
    } catch {
      toast.error(t('agents.createFailed'));
    }
  }

  if (providersError) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">{t('agents.providersFailed')}</h3>
        <p className="text-muted-foreground text-sm">
          {t('agents.providersRequired')}
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
          className="cursor-pointer"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('agents.createAgent')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('agents.createAgentDesc')}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <CardHeader>
            <CardTitle>{t('agents.agentConfig')}</CardTitle>
            <CardDescription>{t('agents.agentConfigDesc')}</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-6">
            {error && (
              <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
                {error}
              </div>
            )}

            {/* Name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">{t('common.name')}</Label>
              <Input
                id="name"
                placeholder={t('agents.namePlaceholder')}
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isSaving}
                required
              />
              <p className="text-muted-foreground text-xs">
                {t('agents.nameHint')}
              </p>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">{t('common.description')}</Label>
              <Textarea
                id="description"
                placeholder={t('agents.descPlaceholder')}
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isSaving}
                rows={3}
              />
              <p className="text-muted-foreground text-xs">
                {t('agents.descHint')}
              </p>
            </div>

            {/* Provider */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="provider">{t('agents.provider')}</Label>
              <select
                id="provider"
                value={providerId}
                onChange={e => handleProviderChange(e.target.value)}
                disabled={isSaving || isLoadingProviders}
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
              <p className="text-muted-foreground text-xs">
                {t('agents.providerHint')}
              </p>
            </div>

            {/* Model */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="model">{t('agents.model')}</Label>
              <select
                id="model"
                value={modelId}
                onChange={e => setModelId(e.target.value)}
                disabled={isSaving || !providerId}
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
              <p className="text-muted-foreground text-xs">
                {t('agents.modelHint')}
              </p>
            </div>

            {/* System Prompt */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="systemPrompt">{t('agents.systemPrompt')}</Label>
              <Textarea
                id="systemPrompt"
                placeholder={t('agents.systemPromptPlaceholder')}
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                disabled={isSaving}
                required
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-muted-foreground text-xs">
                {t('agents.systemPromptHint')}
              </p>
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
                disabled={isSaving}
              />
              <p className="text-muted-foreground text-xs">
                {t('agents.maxTokensHint')}
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
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSaving}
              className="gradient-bg text-white hover:opacity-90 cursor-pointer"
            >
              {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t('agents.createAgent')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

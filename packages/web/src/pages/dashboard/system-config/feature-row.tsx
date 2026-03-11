import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
  Textarea,
} from '@agent-x/design';
import type {
  SystemFeatureConfigResponse,
  SystemProviderResponse,
} from '@agent-x/shared';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import {
  useSystemProviderModels,
  useUpdateSystemFeature,
} from '@/hooks/use-system-config';

export function FeatureRow({
  feature,
  providers,
}: {
  readonly feature: SystemFeatureConfigResponse;
  readonly providers: readonly SystemProviderResponse[];
}) {
  const { t } = useTranslation();
  const updateFeature = useUpdateSystemFeature();

  const [isEnabled, setIsEnabled] = useState(feature.isEnabled);
  const [providerId, setProviderId] = useState(feature.systemProviderId ?? '');
  const [modelId, setModelId] = useState(feature.modelId ?? '');
  const [systemPrompt, setSystemPrompt] = useState(feature.systemPrompt ?? '');
  const [temperature, setTemperature] = useState(feature.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState(feature.maxTokens ?? 4096);
  const [thinkingEnabled, setThinkingEnabled] = useState(
    feature.thinkingEnabled
  );

  const { data: models } = useSystemProviderModels(providerId || undefined);

  // Reset model when provider changes
  useEffect(() => {
    if (providerId !== (feature.systemProviderId ?? '')) {
      setModelId('');
    }
  }, [providerId, feature.systemProviderId]);

  const hasChanges =
    isEnabled !== feature.isEnabled ||
    providerId !== (feature.systemProviderId ?? '') ||
    modelId !== (feature.modelId ?? '') ||
    systemPrompt !== (feature.systemPrompt ?? '') ||
    temperature !== (feature.temperature ?? 0.7) ||
    maxTokens !== (feature.maxTokens ?? 4096) ||
    thinkingEnabled !== feature.thinkingEnabled;

  async function handleSave() {
    try {
      await updateFeature.mutateAsync({
        featureKey: feature.featureKey,
        dto: {
          isEnabled,
          systemProviderId: providerId || null,
          modelId: modelId || null,
          systemPrompt: systemPrompt || null,
          temperature,
          maxTokens,
          thinkingEnabled,
        },
      });
      toast.success(t('systemConfig.featureUpdated'));
    } catch {
      toast.error(t('systemConfig.featureUpdateFailed'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">
              {t(`systemConfig.features.${feature.featureKey}.name`)}
            </CardTitle>
            <CardDescription>
              {t(`systemConfig.features.${feature.featureKey}.description`)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              {isEnabled
                ? t('systemConfig.enabled')
                : t('systemConfig.disabled')}
            </span>
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Provider selector */}
        <div className="flex flex-col gap-2">
          <Label>{t('systemConfig.selectProvider')}</Label>
          <Select value={providerId} onValueChange={setProviderId}>
            <SelectTrigger>
              <SelectValue placeholder={t('systemConfig.selectProvider')} />
            </SelectTrigger>
            <SelectContent>
              {providers.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model selector */}
        <div className="flex flex-col gap-2">
          <Label>{t('systemConfig.selectModel')}</Label>
          <Select
            value={modelId}
            onValueChange={setModelId}
            disabled={!providerId}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('systemConfig.selectModel')} />
            </SelectTrigger>
            <SelectContent>
              {models?.map(m => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* System prompt */}
        <div className="flex flex-col gap-2">
          <Label>{t('agents.systemPrompt')}</Label>
          <Textarea
            placeholder={t('agents.systemPromptPlaceholder')}
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            rows={4}
          />
        </div>

        {/* Temperature */}
        <div className="flex flex-col gap-2">
          <Label>
            {t('agents.temperature')}{' '}
            <span className="text-muted-foreground font-normal">
              ({temperature})
            </span>
          </Label>
          <div className="flex items-center gap-4">
            <Slider
              min={0}
              max={2}
              step={0.1}
              value={[temperature]}
              onValueChange={([v]) => setTemperature(v)}
              className="flex-1"
            />
            <Input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={e => setTemperature(parseFloat(e.target.value) || 0)}
              className="w-20"
            />
          </div>
        </div>

        {/* Max Tokens */}
        <div className="flex flex-col gap-2">
          <Label>{t('agents.maxTokens')}</Label>
          <Input
            type="number"
            min="1"
            value={maxTokens}
            onChange={e => setMaxTokens(parseInt(e.target.value, 10) || 0)}
          />
        </div>

        {/* Thinking Mode */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label>{t('agents.thinkingEnabled')}</Label>
            <p className="text-muted-foreground text-xs">
              {t('agents.thinkingEnabledHint')}
            </p>
          </div>
          <Switch
            checked={thinkingEnabled}
            onCheckedChange={setThinkingEnabled}
          />
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="flex w-full justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || updateFeature.isPending}
          >
            {updateFeature.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            {t('common.save')}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

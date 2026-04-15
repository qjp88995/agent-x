import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Badge,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SettingsAccordionContent,
  SettingsAccordionItem,
  SettingsAccordionTrigger,
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

export function FeatureAccordionItem({
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

  function handleToggle(checked: boolean) {
    setIsEnabled(checked);
    updateFeature.mutate({
      featureKey: feature.featureKey,
      dto: { isEnabled: checked },
    });
  }

  const selectedProvider = providers.find(p => p.id === providerId);
  const selectedModel = models?.find(m => m.id === modelId);

  const summaryBadges = feature.systemProviderId ? (
    <>
      <Badge variant="muted" className="text-xs">
        {selectedProvider?.name ?? '...'} /{' '}
        {selectedModel?.name ?? modelId ?? '...'}
      </Badge>
      <Badge variant="muted" className="text-xs">
        T: {temperature}
      </Badge>
    </>
  ) : (
    <Badge variant="muted" className="text-xs">
      {t('systemConfig.notConfigured')}
    </Badge>
  );

  return (
    <SettingsAccordionItem value={feature.featureKey} disabled={!isEnabled}>
      <SettingsAccordionTrigger
        title={t(`systemConfig.features.${feature.featureKey}.name`)}
        description={t(
          `systemConfig.features.${feature.featureKey}.description`
        )}
        summary={summaryBadges}
        trailing={<Switch checked={isEnabled} onCheckedChange={handleToggle} />}
      />
      <SettingsAccordionContent>
        <div className="flex flex-col gap-4">
          {/* Row 1: Provider + Model */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
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
            <div className="flex flex-col gap-1">
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
          </div>

          {/* Row 2: System Prompt */}
          <div className="flex flex-col gap-1">
            <Label>{t('agents.systemPrompt')}</Label>
            <Textarea
              placeholder={t('agents.systemPromptPlaceholder')}
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={3}
            />
          </div>

          {/* Row 3: Temperature + MaxTokens + Thinking */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
            <div className="flex flex-col gap-1">
              <Label>
                {t('agents.temperature')}{' '}
                <span className="text-foreground-muted font-normal">
                  ({temperature})
                </span>
              </Label>
              <Slider
                min={0}
                max={2}
                step={0.1}
                value={[temperature]}
                onValueChange={([v]) => setTemperature(v)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>{t('agents.maxTokens')}</Label>
              <Input
                type="number"
                min="1"
                value={maxTokens}
                onChange={e => setMaxTokens(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-2.5">
              <Label className="text-xs">{t('agents.thinkingEnabled')}</Label>
              <Switch
                checked={thinkingEnabled}
                onCheckedChange={setThinkingEnabled}
              />
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
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
        </div>
      </SettingsAccordionContent>
    </SettingsAccordionItem>
  );
}

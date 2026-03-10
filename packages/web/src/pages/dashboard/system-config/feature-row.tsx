import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type {
  SystemFeatureConfigResponse,
  SystemProviderResponse,
} from '@agent-x/shared';
import { Loader2, Save } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
    systemPrompt !== (feature.systemPrompt ?? '');

  async function handleSave() {
    try {
      await updateFeature.mutateAsync({
        featureKey: feature.featureKey,
        dto: {
          isEnabled,
          systemProviderId: providerId || null,
          modelId: modelId || null,
          systemPrompt: systemPrompt || null,
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
            <CardTitle className="text-base">{feature.name}</CardTitle>
            {feature.description && (
              <CardDescription>{feature.description}</CardDescription>
            )}
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

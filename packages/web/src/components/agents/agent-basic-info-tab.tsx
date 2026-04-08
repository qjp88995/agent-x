import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import {
  Button,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Slider,
  Switch,
  Textarea,
} from '@agent-x/design';
import type { ProviderModelResponse } from '@agent-x/shared';
import { Loader2 } from 'lucide-react';

import { AutoFillButton } from '@/components/shared/auto-fill-button';
import type { AgentFormValues } from '@/lib/schemas';

type ProviderOption = {
  id: string;
  name: string;
};

type AgentBasicInfoTabProps = {
  form: UseFormReturn<AgentFormValues>;
  activeProviders: ProviderOption[];
  activeModels: ProviderModelResponse[];
  watchedProviderId: string;
  isBusy: boolean;
  isSaving: boolean;
  systemPrompt: string;
};

function AgentBasicInfoTab({
  form,
  activeProviders,
  activeModels,
  watchedProviderId,
  isBusy,
  isSaving,
  systemPrompt,
}: AgentBasicInfoTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      {/* Name */}
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1">
              {t('common.name')}
              <AutoFillButton
                content={systemPrompt}
                fieldDescription="A short, catchy agent name (max 20 characters). Use the same language as the input content."
                onResult={v =>
                  form.setValue('name', v, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                disabled={isBusy}
              />
            </FormLabel>
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
            <FormLabel className="flex items-center gap-1">
              {t('common.description')}
              <AutoFillButton
                content={systemPrompt}
                fieldDescription="A concise description of what this agent does (1-2 sentences). Use the same language as the input content."
                onResult={v =>
                  form.setValue('description', v, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
                disabled={isBusy}
              />
            </FormLabel>
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

      <Separator />

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
                  <SelectValue placeholder={t('agents.selectProvider')} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {activeProviders.map(provider => (
                  <SelectItem key={provider.id} value={provider.id}>
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
                  <SelectItem key={model.id} value={model.modelId}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />

      {/* Temperature */}
      <FormField
        control={form.control}
        name="temperature"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {t('agents.temperature')}{' '}
              <span className="text-foreground-muted font-normal">
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
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                  disabled={isBusy}
                  className="w-20"
                />
              </div>
            </FormControl>
            <FormDescription>{t('agents.temperatureHint')}</FormDescription>
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
                  field.onChange(parseInt(e.target.value, 10) || 0)
                }
                disabled={isBusy}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Thinking Enabled */}
      <FormField
        control={form.control}
        name="thinkingEnabled"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel>{t('agents.thinkingEnabled')}</FormLabel>
              <FormDescription>
                {t('agents.thinkingEnabledHint')}
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isBusy}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Footer */}
      <Separator />
      <div className="flex items-center gap-3">
        <div className="flex-1" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => navigate('/agents')}
          disabled={isSaving}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={!form.formState.isValid || isSaving}
          variant="primary"
        >
          {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
          {t('common.save')}
        </Button>
      </div>
    </div>
  );
}

export { AgentBasicInfoTab };
export type { AgentBasicInfoTabProps };

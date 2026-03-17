import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import {
  Button,
  CodeEditor,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Slider,
  Textarea,
} from '@agent-x/design';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { AutoFillButton } from '@/components/shared/auto-fill-button';
import { PolishButton } from '@/components/shared/polish-button';
import { PromptPickerButton } from '@/components/shared/prompt-picker-button';
import { SavePromptButton } from '@/components/shared/save-prompt-button';
import { useCreateAgent } from '@/hooks/use-agents';
import { useProviders } from '@/hooks/use-providers';
import { type AgentFormValues, agentSchema } from '@/lib/schemas';

export default function CreateAgentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createAgent = useCreateAgent();
  const {
    data: providers,
    isLoading: isLoadingProviders,
    error: providersError,
  } = useProviders();

  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: '',
      description: '',
      providerId: '',
      modelId: '',
      systemPrompt: '',
      temperature: 0.7,
      maxTokens: 4096,
      thinkingEnabled: false,
    },
    mode: 'onChange',
  });

  const activeProviders = useMemo(
    () => providers?.filter(p => p.isActive) ?? [],
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

  useEffect(() => {
    form.setValue('modelId', '');
  }, [watchedProviderId, form]);

  const isSaving = createAgent.isPending;

  function handlePromptChange(content: string) {
    form.setValue('systemPrompt', content, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  async function onSubmit(values: AgentFormValues) {
    if (isSaving) return;

    try {
      await createAgent.mutateAsync({
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        providerId: values.providerId,
        modelId: values.modelId,
        systemPrompt: values.systemPrompt.trim(),
        temperature: values.temperature,
        maxTokens: values.maxTokens,
        thinkingEnabled: values.thinkingEnabled,
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
        <p className="text-foreground-muted text-sm">
          {t('agents.providersRequired')}
        </p>
      </div>
    );
  }

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
        title={t('agents.createAgent')}
      />
      <div className="flex-1 overflow-auto p-5">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-6 lg:flex-row">
              {/* Left: config fields */}
              <div className="flex w-full flex-col gap-6 lg:w-1/2">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        {t('common.name')}
                        <AutoFillButton
                          content={form.watch('systemPrompt')}
                          fieldDescription="A short, catchy agent name (max 20 characters). Use the same language as the input content."
                          onResult={v =>
                            form.setValue('name', v, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }
                          disabled={isSaving}
                        />
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('agents.namePlaceholder')}
                          disabled={isSaving}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>{t('agents.nameHint')}</FormDescription>
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
                          content={form.watch('systemPrompt')}
                          fieldDescription="A concise description of what this agent does (1-2 sentences). Use the same language as the input content."
                          onResult={v =>
                            form.setValue('description', v, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }
                          disabled={isSaving}
                        />
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('agents.descPlaceholder')}
                          disabled={isSaving}
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>{t('agents.descHint')}</FormDescription>
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
                        onValueChange={field.onChange}
                        disabled={isSaving || isLoadingProviders}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={
                                isLoadingProviders
                                  ? t('agents.loadingProviders')
                                  : t('agents.selectProvider')
                              }
                            />
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
                      <FormDescription>
                        {t('agents.providerHint')}
                      </FormDescription>
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
                        disabled={isSaving || !watchedProviderId}
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
                      <FormDescription>{t('agents.modelHint')}</FormDescription>
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
                            disabled={isSaving}
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
                            disabled={isSaving}
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
                            field.onChange(parseInt(e.target.value, 10) || 0)
                          }
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('agents.maxTokensHint')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right: system prompt */}
              <div className="flex min-h-96 w-full flex-col gap-3 lg:min-h-0 lg:w-1/2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">
                      {t('agents.systemPrompt')}
                    </h3>
                    <p className="text-foreground-muted text-xs">
                      {t('agents.systemPromptHint')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <PolishButton
                      content={form.watch('systemPrompt') ?? ''}
                      onApply={handlePromptChange}
                      disabled={isSaving}
                    />
                    <PromptPickerButton
                      onSelect={handlePromptChange}
                      disabled={isSaving}
                    />
                    <SavePromptButton
                      content={form.watch('systemPrompt') ?? ''}
                      defaultName={form.watch('name')}
                      disabled={isSaving}
                    />
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="systemPrompt"
                  render={({ field }) => (
                    <FormItem className="flex flex-1 flex-col">
                      <FormControl>
                        <CodeEditor
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t('agents.systemPromptPlaceholder')}
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
                {t('agents.createAgent')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

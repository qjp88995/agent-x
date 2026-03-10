import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/shared/page-header';
import { PolishButton } from '@/components/shared/polish-button';
import { PromptEditor } from '@/components/shared/prompt-editor';
import { PromptPickerButton } from '@/components/shared/prompt-picker-button';
import { SavePromptButton } from '@/components/shared/save-prompt-button';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
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
    <div className="-m-6 flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <PageHeader
          backTo="/agents"
          backLabel={t('agents.backToAgents')}
          title={t('agents.createAgent')}
          description={t('agents.createAgentDesc')}
        />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col gap-6"
          >
            <div className="flex min-h-0 flex-1 gap-6">
              {/* Left: Basic Info */}
              <Card className="flex w-1/2 flex-col">
                <CardHeader>
                  <CardTitle>{t('agents.agentConfig')}</CardTitle>
                  <CardDescription>
                    {t('agents.agentConfigDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-6 overflow-y-auto">
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
                            disabled={isSaving}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('agents.nameHint')}
                        </FormDescription>
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
                            disabled={isSaving}
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('agents.descHint')}
                        </FormDescription>
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
                        <FormDescription>
                          {t('agents.modelHint')}
                        </FormDescription>
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
                </CardContent>
              </Card>

              {/* Right: System Prompt */}
              <Card className="flex w-1/2 flex-col">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex flex-col gap-1.5">
                    <CardTitle>{t('agents.systemPrompt')}</CardTitle>
                    <CardDescription>
                      {t('agents.systemPromptHint')}
                    </CardDescription>
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
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col">
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
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t pt-6">
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

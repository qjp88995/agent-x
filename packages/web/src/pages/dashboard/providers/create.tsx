import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';

import {
  Button,
  ErrorState,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  LoadingState,
  PageHeader,
  Separator,
} from '@agent-x/design';
import type { ProviderProtocol as ProviderProtocolType } from '@agent-x/shared';
import { ProviderProtocol } from '@agent-x/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  useCreateProvider,
  useProvider,
  useTestProvider,
  useUpdateProvider,
} from '@/hooks/use-providers';
import { DEFAULT_BASE_URLS, PROTOCOL_OPTIONS } from '@/lib/provider-constants';
import {
  type CreateProviderFormValues,
  createProviderSchema,
  type UpdateProviderFormValues,
  updateProviderSchema,
} from '@/lib/schemas';
import { cn } from '@/lib/utils';

export default function CreateProviderPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const { data: existingProvider, isLoading: isLoadingProvider } =
    useProvider(id);
  const createProvider = useCreateProvider();
  const updateProvider = useUpdateProvider();
  const testProvider = useTestProvider();

  const form = useForm<CreateProviderFormValues | UpdateProviderFormValues>({
    resolver: zodResolver(
      isEditMode ? updateProviderSchema : createProviderSchema
    ),
    defaultValues: {
      name: '',
      ...(isEditMode ? {} : { protocol: ProviderProtocol.OPENAI as string }),
      baseUrl: DEFAULT_BASE_URLS.OPENAI,
      apiKey: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (existingProvider) {
      form.reset({
        name: existingProvider.name,
        baseUrl: existingProvider.baseUrl,
        apiKey: '',
      });
    }
  }, [existingProvider, form]);

  const watchedProtocol = form.watch('protocol' as never) as unknown as
    | ProviderProtocolType
    | undefined;

  useEffect(() => {
    if (!isEditMode && watchedProtocol && !form.formState.dirtyFields.baseUrl) {
      form.setValue('baseUrl', DEFAULT_BASE_URLS[watchedProtocol]);
    }
  }, [watchedProtocol, isEditMode, form]);

  const isSaving = createProvider.isPending || updateProvider.isPending;

  function handleTest() {
    if (!isEditMode) return;
    testProvider.mutate(id, {
      onSuccess: result => {
        if (result.success) {
          toast.success(t('providers.testSuccess'));
        } else {
          toast.error(t('providers.testFailed'));
        }
      },
      onError: () => {
        toast.error(t('providers.testFailed'));
      },
    });
  }

  async function onSubmit(
    values: CreateProviderFormValues | UpdateProviderFormValues
  ) {
    if (isSaving) return;

    try {
      if (isEditMode) {
        const updateValues = values as UpdateProviderFormValues;
        await updateProvider.mutateAsync({
          id,
          dto: {
            name: updateValues.name.trim(),
            baseUrl: updateValues.baseUrl.trim(),
            ...(updateValues.apiKey?.trim()
              ? { apiKey: updateValues.apiKey.trim() }
              : {}),
          },
        });
        toast.success(t('providers.updated'));
      } else {
        const createValues = values as CreateProviderFormValues;
        await createProvider.mutateAsync({
          name: createValues.name.trim(),
          protocol: createValues.protocol as ProviderProtocolType,
          baseUrl: createValues.baseUrl.trim(),
          apiKey: createValues.apiKey.trim(),
        });
        toast.success(t('providers.created'));
      }
      await navigate('/providers');
    } catch {
      toast.error(
        isEditMode ? t('providers.updateFailed') : t('providers.createFailed')
      );
    }
  }

  if (isEditMode && isLoadingProvider) {
    return <LoadingState message={t('providers.loadingProvider')} />;
  }

  if (isEditMode && !isLoadingProvider && !existingProvider) {
    return (
      <ErrorState
        title={t('providers.notFound')}
        description={t('providers.notFoundDesc')}
        actionLabel={t('providers.backToProviders')}
        onAction={() => navigate('/providers')}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <PageHeader
        leading={
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => navigate('/providers')}
            aria-label={t('providers.backToProviders')}
          >
            <ArrowLeft className="size-3.5" />
          </Button>
        }
        title={
          isEditMode ? t('providers.editProvider') : t('providers.addProvider')
        }
      />

      {/* Form content */}
      <div className="flex-1 overflow-auto p-5">
        <Form {...form}>
          <form
            id="provider-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex max-w-2xl flex-col gap-6"
          >
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('providers.namePlaceholder')}
                      disabled={isSaving}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t('providers.nameHint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Protocol */}
            {!isEditMode && (
              <FormField
                control={form.control}
                name={'protocol' as never}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('providers.protocol')}</FormLabel>
                    <FormControl>
                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                        {PROTOCOL_OPTIONS.map(option => (
                          <button
                            key={option.value}
                            type="button"
                            disabled={isSaving}
                            onClick={() => field.onChange(option.value)}
                            className={cn(
                              'flex flex-col items-start rounded-md border p-3 text-left transition-colors',
                              field.value === option.value
                                ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
                                : 'hover:bg-card',
                              isSaving && 'cursor-not-allowed opacity-60'
                            )}
                          >
                            <span className="text-sm font-medium">
                              {t(option.labelKey)}
                            </span>
                            <span className="text-foreground-muted text-xs">
                              {t(option.descKey)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isEditMode && existingProvider && (
              <div className="flex flex-col gap-2">
                <FormLabel>{t('providers.protocol')}</FormLabel>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                  {PROTOCOL_OPTIONS.filter(
                    o => o.value === existingProvider.protocol
                  ).map(option => (
                    <div
                      key={option.value}
                      className="border-primary bg-primary/5 ring-primary/20 flex flex-col items-start rounded-md border p-3 text-left ring-2"
                    >
                      <span className="text-sm font-medium">
                        {t(option.labelKey)}
                      </span>
                      <span className="text-foreground-muted text-xs">
                        {t(option.descKey)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-foreground-muted text-xs">
                  {t('providers.protocolLocked')}
                </p>
              </div>
            )}

            <Separator />

            {/* Base URL */}
            <FormField
              control={form.control}
              name="baseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('providers.baseUrl')}</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder={t('providers.baseUrlPlaceholder')}
                      disabled={isSaving}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('providers.baseUrlHint')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* API Key */}
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('providers.apiKey')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={
                        isEditMode
                          ? t('providers.apiKeyKeep')
                          : t('providers.apiKeyPlaceholder')
                      }
                      disabled={isSaving}
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {isEditMode
                      ? t('providers.apiKeyKeepHint')
                      : t('providers.apiKeyHint')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Footer */}
            <Separator />
            <div className="flex items-center gap-3">
              {isEditMode && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTest}
                  disabled={testProvider.isPending}
                >
                  {testProvider.isPending && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {t('providers.testConnection')}
                </Button>
              )}
              <div className="flex-1" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate('/providers')}
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
                {isEditMode ? t('common.save') : t('providers.createProvider')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

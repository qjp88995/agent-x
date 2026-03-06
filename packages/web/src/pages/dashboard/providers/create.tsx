import { type FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';

import type { ProviderProtocol as ProviderProtocolType } from '@agent-x/shared';
import { ProviderProtocol } from '@agent-x/shared';
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useCreateProvider,
  useProvider,
  useTestProvider,
  useUpdateProvider,
} from '@/hooks/use-providers';
import { cn } from '@/lib/utils';

const DEFAULT_BASE_URLS: Record<ProviderProtocolType, string> = {
  OPENAI: 'https://api.openai.com/v1',
  ANTHROPIC: 'https://api.anthropic.com',
  GEMINI: 'https://generativelanguage.googleapis.com/v1beta',
  DEEPSEEK: 'https://api.deepseek.com',
  QWEN: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  ZHIPU: 'https://open.bigmodel.cn/api/paas/v4/',
  MOONSHOT: 'https://api.moonshot.ai/v1',
};

const PROTOCOL_OPTIONS: readonly {
  value: ProviderProtocolType;
  labelKey: string;
  descKey: string;
}[] = [
  {
    value: ProviderProtocol.OPENAI,
    labelKey: 'providers.openai',
    descKey: 'providers.openaiDesc',
  },
  {
    value: ProviderProtocol.ANTHROPIC,
    labelKey: 'providers.anthropic',
    descKey: 'providers.anthropicDesc',
  },
  {
    value: ProviderProtocol.GEMINI,
    labelKey: 'providers.gemini',
    descKey: 'providers.geminiDesc',
  },
  {
    value: ProviderProtocol.DEEPSEEK,
    labelKey: 'providers.deepseek',
    descKey: 'providers.deepseekDesc',
  },
  {
    value: ProviderProtocol.QWEN,
    labelKey: 'providers.qwen',
    descKey: 'providers.qwenDesc',
  },
  {
    value: ProviderProtocol.ZHIPU,
    labelKey: 'providers.zhipu',
    descKey: 'providers.zhipuDesc',
  },
  {
    value: ProviderProtocol.MOONSHOT,
    labelKey: 'providers.moonshot',
    descKey: 'providers.moonshotDesc',
  },
] as const;

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

  const [name, setName] = useState('');
  const [protocol, setProtocol] = useState<ProviderProtocolType>(
    ProviderProtocol.OPENAI
  );
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URLS.OPENAI);
  const [apiKey, setApiKey] = useState('');
  const [hasChangedUrl, setHasChangedUrl] = useState(false);

  // Pre-fill form when editing
  useEffect(() => {
    if (existingProvider) {
      setName(existingProvider.name);
      setProtocol(existingProvider.protocol);
      setBaseUrl(existingProvider.baseUrl);
      setHasChangedUrl(true);
    }
  }, [existingProvider]);

  // Auto-fill base URL when protocol changes (unless user has manually changed it)
  function handleProtocolChange(newProtocol: ProviderProtocolType) {
    setProtocol(newProtocol);
    if (!hasChangedUrl) {
      setBaseUrl(DEFAULT_BASE_URLS[newProtocol]);
    }
  }

  function handleBaseUrlChange(value: string) {
    setBaseUrl(value);
    setHasChangedUrl(true);
  }

  const isFormValid =
    name.trim().length > 0 &&
    baseUrl.trim().length > 0 &&
    (isEditMode || apiKey.trim().length > 0);

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isFormValid || isSaving) return;

    try {
      if (isEditMode) {
        await updateProvider.mutateAsync({
          id,
          dto: {
            name: name.trim(),
            baseUrl: baseUrl.trim(),
            ...(apiKey.trim().length > 0 ? { apiKey: apiKey.trim() } : {}),
          },
        });
        toast.success(t('providers.updated'));
      } else {
        await createProvider.mutateAsync({
          name: name.trim(),
          protocol,
          baseUrl: baseUrl.trim(),
          apiKey: apiKey.trim(),
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
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground text-sm">
          {t('providers.loadingProvider')}
        </div>
      </div>
    );
  }

  if (isEditMode && !isLoadingProvider && !existingProvider) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">{t('providers.notFound')}</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          {t('providers.notFoundDesc')}
        </p>
        <Button variant="outline" onClick={() => navigate('/providers')}>
          {t('providers.backToProviders')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/providers')}
              aria-label="Back to providers"
              className="cursor-pointer"
            >
              <ArrowLeft className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('providers.backToProviders')}</TooltipContent>
        </Tooltip>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditMode
              ? t('providers.editProvider')
              : t('providers.addProvider')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isEditMode
              ? t('providers.editProviderDesc')
              : t('providers.addProviderDesc')}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl border-border/50">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <CardHeader>
            <CardTitle>{t('providers.providerDetails')}</CardTitle>
            <CardDescription>
              {t('providers.providerDetailsDesc')}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-6">
            {/* Name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">{t('common.name')}</Label>
              <Input
                id="name"
                placeholder={t('providers.namePlaceholder')}
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isSaving}
                required
              />
              <p className="text-muted-foreground text-xs">
                {t('providers.nameHint')}
              </p>
            </div>

            {/* Protocol */}
            <div className="flex flex-col gap-2">
              <Label>{t('providers.protocol')}</Label>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {PROTOCOL_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={isEditMode || isSaving}
                    onClick={() => handleProtocolChange(option.value)}
                    className={cn(
                      'flex flex-col items-start rounded-md border p-3 text-left transition-colors',
                      protocol === option.value
                        ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
                        : 'hover:bg-accent',
                      (isEditMode || isSaving) &&
                        'cursor-not-allowed opacity-60'
                    )}
                  >
                    <span className="text-sm font-medium">
                      {t(option.labelKey)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {t(option.descKey)}
                    </span>
                  </button>
                ))}
              </div>
              {isEditMode && (
                <p className="text-muted-foreground text-xs">
                  {t('providers.protocolLocked')}
                </p>
              )}
            </div>

            {/* Base URL */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="baseUrl">{t('providers.baseUrl')}</Label>
              <Input
                id="baseUrl"
                type="url"
                placeholder={t('providers.baseUrlPlaceholder')}
                value={baseUrl}
                onChange={e => handleBaseUrlChange(e.target.value)}
                disabled={isSaving}
                required
              />
              <p className="text-muted-foreground text-xs">
                {t('providers.baseUrlHint')}
              </p>
            </div>

            {/* API Key */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="apiKey">{t('providers.apiKey')}</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder={
                  isEditMode
                    ? t('providers.apiKeyKeep')
                    : t('providers.apiKeyPlaceholder')
                }
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                disabled={isSaving}
                required={!isEditMode}
                autoComplete="off"
              />
              <p className="text-muted-foreground text-xs">
                {isEditMode
                  ? t('providers.apiKeyKeepHint')
                  : t('providers.apiKeyHint')}
              </p>
            </div>

            {/* Test Connection (only in edit mode) */}
            {isEditMode && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
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
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/providers')}
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
              {isEditMode ? t('common.save') : t('providers.createProvider')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

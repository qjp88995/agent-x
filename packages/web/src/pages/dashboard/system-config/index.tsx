import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type {
  ProviderProtocol as ProviderProtocolType,
  SystemFeatureConfigResponse,
  SystemProviderResponse,
} from '@agent-x/shared';
import { ProviderProtocol } from '@agent-x/shared';
import {
  AlertTriangle,
  Database,
  Loader2,
  Pencil,
  PlugZap,
  Plus,
  Save,
  Trash2,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useCreateSystemProvider,
  useDeleteSystemProvider,
  useSystemFeatures,
  useSystemProviderModels,
  useSystemProviders,
  useTestSystemProvider,
  useUpdateSystemFeature,
  useUpdateSystemProvider,
} from '@/hooks/use-system-config';
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

const PROTOCOL_CONFIG: Record<
  ProviderProtocolType,
  { labelKey: string; className: string }
> = {
  OPENAI: {
    labelKey: 'providers.openai',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  ANTHROPIC: {
    labelKey: 'providers.anthropic',
    className:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
  GEMINI: {
    labelKey: 'providers.gemini',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  DEEPSEEK: {
    labelKey: 'providers.deepseek',
    className:
      'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  },
  QWEN: {
    labelKey: 'providers.qwen',
    className:
      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  },
  ZHIPU: {
    labelKey: 'providers.zhipu',
    className:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  MOONSHOT: {
    labelKey: 'providers.moonshot',
    className:
      'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  },
};

// ── Provider Form Dialog ──────────────────────────────────────────────

interface ProviderFormState {
  name: string;
  protocol: ProviderProtocolType;
  baseUrl: string;
  apiKey: string;
}

const INITIAL_FORM: ProviderFormState = {
  name: '',
  protocol: ProviderProtocol.OPENAI,
  baseUrl: DEFAULT_BASE_URLS.OPENAI,
  apiKey: '',
};

function ProviderFormDialog({
  open,
  onOpenChange,
  editingProvider,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly editingProvider: SystemProviderResponse | null;
}) {
  const { t } = useTranslation();
  const isEdit = !!editingProvider;

  const [form, setForm] = useState<ProviderFormState>(INITIAL_FORM);

  const createProvider = useCreateSystemProvider();
  const updateProvider = useUpdateSystemProvider();
  const isSaving = createProvider.isPending || updateProvider.isPending;

  useEffect(() => {
    if (open) {
      if (editingProvider) {
        setForm({
          name: editingProvider.name,
          protocol: editingProvider.protocol,
          baseUrl: editingProvider.baseUrl,
          apiKey: '',
        });
      } else {
        setForm(INITIAL_FORM);
      }
    }
  }, [open, editingProvider]);

  function handleProtocolChange(protocol: ProviderProtocolType) {
    setForm(prev => ({
      ...prev,
      protocol,
      baseUrl: DEFAULT_BASE_URLS[protocol],
    }));
  }

  async function handleSubmit() {
    if (isSaving) return;

    try {
      if (isEdit) {
        await updateProvider.mutateAsync({
          id: editingProvider.id,
          dto: {
            name: form.name.trim(),
            baseUrl: form.baseUrl.trim(),
            ...(form.apiKey.trim() ? { apiKey: form.apiKey.trim() } : {}),
          },
        });
        toast.success(t('systemConfig.updated'));
      } else {
        await createProvider.mutateAsync({
          name: form.name.trim(),
          protocol: form.protocol,
          baseUrl: form.baseUrl.trim(),
          apiKey: form.apiKey.trim(),
        });
        toast.success(t('systemConfig.created'));
      }
      onOpenChange(false);
    } catch {
      toast.error(
        isEdit ? t('systemConfig.updateFailed') : t('systemConfig.createFailed')
      );
    }
  }

  const isValid =
    form.name.trim() && form.baseUrl.trim() && (isEdit || form.apiKey.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t('systemConfig.editProvider')
              : t('systemConfig.addProvider')}
          </DialogTitle>
          <DialogDescription>
            {t('systemConfig.providerDetailsDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <Label>{t('common.name')}</Label>
            <Input
              placeholder={t('providers.namePlaceholder')}
              value={form.name}
              onChange={e =>
                setForm(prev => ({ ...prev, name: e.target.value }))
              }
              disabled={isSaving}
            />
          </div>

          {/* Protocol */}
          {!isEdit && (
            <div className="flex flex-col gap-2">
              <Label>{t('providers.protocol')}</Label>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {PROTOCOL_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleProtocolChange(option.value)}
                    className={cn(
                      'flex flex-col items-start rounded-md border p-2.5 text-left transition-colors',
                      form.protocol === option.value
                        ? 'border-primary bg-primary/5 ring-primary/20 ring-2'
                        : 'hover:bg-accent',
                      isSaving && 'cursor-not-allowed opacity-60'
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
            </div>
          )}

          {isEdit && (
            <div className="flex flex-col gap-2">
              <Label>{t('providers.protocol')}</Label>
              <Badge
                variant="outline"
                className={cn(
                  'w-fit border-0',
                  PROTOCOL_CONFIG[editingProvider.protocol].className
                )}
              >
                {t(PROTOCOL_CONFIG[editingProvider.protocol].labelKey)}
              </Badge>
            </div>
          )}

          {/* Base URL */}
          <div className="flex flex-col gap-2">
            <Label>{t('providers.baseUrl')}</Label>
            <Input
              type="url"
              placeholder={t('providers.baseUrlPlaceholder')}
              value={form.baseUrl}
              onChange={e =>
                setForm(prev => ({ ...prev, baseUrl: e.target.value }))
              }
              disabled={isSaving}
            />
          </div>

          {/* API Key */}
          <div className="flex flex-col gap-2">
            <Label>{t('providers.apiKey')}</Label>
            <Input
              type="password"
              placeholder={
                isEdit
                  ? t('providers.apiKeyKeep')
                  : t('providers.apiKeyPlaceholder')
              }
              value={form.apiKey}
              onChange={e =>
                setForm(prev => ({ ...prev, apiKey: e.target.value }))
              }
              disabled={isSaving}
              autoComplete="off"
            />
            {isEdit && (
              <p className="text-muted-foreground text-xs">
                {t('providers.apiKeyKeepHint')}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isValid || isSaving}
          >
            {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isEdit ? t('common.save') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Provider Card ─────────────────────────────────────────────────────

function ProviderCard({
  provider,
  onEdit,
  onDelete,
}: {
  readonly provider: SystemProviderResponse;
  readonly onEdit: (provider: SystemProviderResponse) => void;
  readonly onDelete: (provider: SystemProviderResponse) => void;
}) {
  const { t } = useTranslation();
  const testProvider = useTestSystemProvider();

  function handleTest() {
    testProvider.mutate(provider.id, {
      onSuccess: result => {
        if (result.success) {
          toast.success(t('systemConfig.testSuccess'));
        } else {
          toast.error(t('systemConfig.testFailed'));
        }
      },
      onError: () => {
        toast.error(t('systemConfig.testFailed'));
      },
    });
  }

  const protocolConfig = PROTOCOL_CONFIG[provider.protocol];

  return (
    <Card className="flex flex-col hover:shadow-md hover:border-primary/20 transition-all duration-200">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base">{provider.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn('border-0', protocolConfig.className)}
            >
              {t(protocolConfig.labelKey)}
            </Badge>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'inline-block size-2 rounded-full',
                  provider.isActive ? 'bg-green-500' : 'bg-gray-400'
                )}
              />
              <span className="text-muted-foreground text-xs">
                {provider.isActive ? t('common.active') : t('common.inactive')}
              </span>
            </div>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost-destructive"
              size="icon"
              className="size-8"
              onClick={() => onDelete(provider)}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">{t('common.delete')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('common.delete')}</TooltipContent>
        </Tooltip>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-muted-foreground truncate text-sm">
          {provider.baseUrl}
        </p>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="flex w-full items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={handleTest}
                disabled={testProvider.isPending}
              >
                {testProvider.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <PlugZap className="size-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {testProvider.isPending
                ? t('systemConfig.testing')
                : t('systemConfig.testConnection')}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => onEdit(provider)}
              >
                <Pencil className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('common.edit')}</TooltipContent>
          </Tooltip>
        </div>
      </CardFooter>
    </Card>
  );
}

// ── Providers Tab ─────────────────────────────────────────────────────

function ProvidersTab() {
  const { t } = useTranslation();
  const { data: providers, isLoading, error } = useSystemProviders();
  const deleteProvider = useDeleteSystemProvider();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] =
    useState<SystemProviderResponse | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<SystemProviderResponse | null>(null);

  function handleEdit(provider: SystemProviderResponse) {
    setEditingProvider(provider);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditingProvider(null);
    setDialogOpen(true);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteProvider.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success(t('systemConfig.deleted'));
      },
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground text-sm">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">
          {t('common.failedToLoad', {
            resource: t('systemConfig.providers').toLowerCase(),
          })}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t('common.tryRefreshing')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {t('systemConfig.providers')}
          </h2>
          <p className="text-muted-foreground text-sm">
            {t('systemConfig.providersDesc')}
          </p>
        </div>
        <Button variant="primary" onClick={handleAdd}>
          <Plus className="mr-2 size-4" />
          {t('systemConfig.addProvider')}
        </Button>
      </div>

      {!providers || providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <div className="gradient-bg mb-4 flex size-16 items-center justify-center rounded-full text-white">
            <Database className="size-8" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">
            {t('systemConfig.noProviders')}
          </h3>
          <p className="text-muted-foreground mb-6 text-sm">
            {t('systemConfig.noProvidersDesc')}
          </p>
          <Button variant="primary" onClick={handleAdd}>
            <Plus className="mr-2 size-4" />
            {t('systemConfig.addProvider')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {providers.map(provider => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <ProviderFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingProvider={editingProvider}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent variant="destructive">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('systemConfig.deleteProvider')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('systemConfig.deleteConfirm', { name: deleteTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteProvider.isPending}
            >
              {deleteProvider.isPending
                ? t('common.deleting')
                : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Feature Row ───────────────────────────────────────────────────────

function FeatureRow({
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

// ── Features Tab ──────────────────────────────────────────────────────

function FeaturesTab() {
  const { t } = useTranslation();
  const { data: features, isLoading, error } = useSystemFeatures();
  const { data: providers } = useSystemProviders();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground text-sm">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">
          {t('common.failedToLoad', {
            resource: t('systemConfig.features').toLowerCase(),
          })}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t('common.tryRefreshing')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">{t('systemConfig.features')}</h2>
        <p className="text-muted-foreground text-sm">
          {t('systemConfig.featuresDesc')}
        </p>
      </div>

      {!features || features.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <div className="gradient-bg mb-4 flex size-16 items-center justify-center rounded-full text-white">
            <Wrench className="size-8" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">
            {t('common.noResults')}
          </h3>
        </div>
      ) : (
        <div className="flex max-w-4xl flex-col gap-4">
          {features.map(feature => (
            <FeatureRow
              key={feature.id}
              feature={feature}
              providers={providers ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────

export default function SystemConfigPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('systemConfig.title')}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t('systemConfig.subtitle')}
        </p>
      </div>

      <Tabs defaultValue="providers">
        <TabsList>
          <TabsTrigger value="providers">
            {t('systemConfig.providers')}
          </TabsTrigger>
          <TabsTrigger value="features">
            {t('systemConfig.features')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="providers" className="mt-6">
          <ProvidersTab />
        </TabsContent>
        <TabsContent value="features" className="mt-6">
          <FeaturesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type {
  ProviderProtocol as ProviderProtocolType,
  SystemProviderResponse,
} from '@agent-x/shared';
import { ProviderProtocol } from '@agent-x/shared';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  useCreateSystemProvider,
  useUpdateSystemProvider,
} from '@/hooks/use-system-config';
import { cn } from '@/lib/utils';

import {
  DEFAULT_BASE_URLS,
  PROTOCOL_CONFIG,
  PROTOCOL_OPTIONS,
} from './constants';

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

export function ProviderFormDialog({
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

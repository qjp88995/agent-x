import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ClipboardCopy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogClose,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAgents } from '@/hooks/use-agents';
import { useCreateApiKey } from '@/hooks/use-api-keys';
import { type CreateApiKeyFormValues, createApiKeySchema } from '@/lib/schemas';

interface CreateKeyDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function CreateKeyDialog({ open, onOpenChange }: CreateKeyDialogProps) {
  const { t } = useTranslation();
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createApiKey = useCreateApiKey();
  const { data: agents } = useAgents();

  const form = useForm<CreateApiKeyFormValues>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: { name: '', agentId: '', expiresAt: undefined },
    mode: 'onChange',
  });

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset();
      setCreatedKey(null);
      setCopied(false);
    }
    onOpenChange(nextOpen);
  }

  function handleCreate(values: CreateApiKeyFormValues) {
    createApiKey.mutate(
      {
        name: values.name,
        agentId: values.agentId || undefined,
        expiresAt: values.expiresAt
          ? values.expiresAt.toISOString()
          : undefined,
      },
      {
        onSuccess: data => {
          setCreatedKey(data.plainKey);
        },
      }
    );
  }

  async function handleCopy() {
    if (!createdKey) return;
    try {
      await navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in non-HTTPS contexts
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {createdKey ? t('apiKeys.keyCreated') : t('apiKeys.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {createdKey ? t('apiKeys.keyCreatedDesc') : t('apiKeys.createDesc')}
          </DialogDescription>
        </DialogHeader>

        {createdKey ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
              <p className="mb-2 text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {t('apiKeys.createWarning')}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all rounded bg-yellow-100 px-2 py-1 font-mono text-xs dark:bg-yellow-900">
                  {createdKey}
                </code>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="size-4 text-green-600" />
                      ) : (
                        <ClipboardCopy className="size-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('common.copy')}</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button>{t('common.done')}</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : (
          <form
            onSubmit={form.handleSubmit(handleCreate)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="key-name">{t('common.name')}</Label>
              <Input
                id="key-name"
                placeholder={t('apiKeys.namePlaceholder')}
                {...form.register('name')}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t('apiKeys.agentOptional')}</Label>
              <Controller
                control={form.control}
                name="agentId"
                render={({ field }) => (
                  <Select
                    value={field.value || '__any__'}
                    onValueChange={v =>
                      field.onChange(v === '__any__' ? '' : v)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('apiKeys.anyAgent')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__any__">
                        {t('apiKeys.anyAgent')}
                      </SelectItem>
                      {agents?.map(agent => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-muted-foreground text-xs">
                {t('apiKeys.agentHint')}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t('apiKeys.expiration')}</Label>
              <Controller
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t('apiKeys.selectExpiration')}
                    fromDate={new Date()}
                    clearable
                  />
                )}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  {t('common.cancel')}
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={!form.formState.isValid || createApiKey.isPending}
                variant="primary"
              >
                {createApiKey.isPending
                  ? t('apiKeys.creating')
                  : t('apiKeys.createKey')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

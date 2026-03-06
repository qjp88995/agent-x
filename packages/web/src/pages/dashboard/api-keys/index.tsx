import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Locale } from 'date-fns';
import { format } from 'date-fns';
import {
  AlertTriangle,
  Check,
  ClipboardCopy,
  Key,
  Plus,
  Trash2,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAgents } from '@/hooks/use-agents';
import type { ApiKeyResponse } from '@/hooks/use-api-keys';
import {
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
} from '@/hooks/use-api-keys';
import { useDateLocale } from '@/hooks/use-date-locale';

function formatDate(dateStr: string | null, locale: Locale): string {
  if (!dateStr) return '-';
  return format(new Date(dateStr), 'PPP', { locale });
}

function StatusBadge({
  isActive,
  expiresAt,
}: {
  readonly isActive: boolean;
  readonly expiresAt: string | null;
}) {
  const { t } = useTranslation();

  if (!isActive) {
    return (
      <Badge
        variant="outline"
        className="border-0 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      >
        {t('apiKeys.revoked')}
      </Badge>
    );
  }

  if (expiresAt && new Date(expiresAt) < new Date()) {
    return (
      <Badge
        variant="outline"
        className="border-0 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      >
        {t('apiKeys.expired')}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    >
      {t('common.active')}
    </Badge>
  );
}

function CreateKeyDialog({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [agentId, setAgentId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createApiKey = useCreateApiKey();
  const { data: agents } = useAgents();

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setName('');
      setAgentId('');
      setExpiresAt('');
      setCreatedKey(null);
      setCopied(false);
    }
    onOpenChange(nextOpen);
  }

  function handleCreate() {
    createApiKey.mutate(
      {
        name,
        agentId: agentId || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
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
      <DialogContent className="sm:max-w-lg">
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
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button>{t('common.done')}</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="key-name">{t('common.name')}</Label>
              <Input
                id="key-name"
                placeholder={t('apiKeys.namePlaceholder')}
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="key-agent">{t('apiKeys.agentOptional')}</Label>
              <select
                id="key-agent"
                className="border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-0.75 disabled:cursor-not-allowed disabled:opacity-50"
                value={agentId}
                onChange={e => setAgentId(e.target.value)}
              >
                <option value="">{t('apiKeys.anyAgent')}</option>
                {agents?.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              <p className="text-muted-foreground text-xs">
                {t('apiKeys.agentHint')}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="key-expires">{t('apiKeys.expiration')}</Label>
              <Input
                id="key-expires"
                type="date"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">{t('common.cancel')}</Button>
              </DialogClose>
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || createApiKey.isPending}
              >
                {createApiKey.isPending
                  ? t('apiKeys.creating')
                  : t('apiKeys.createKey')}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmDialog({
  target,
  onOpenChange,
}: {
  readonly target: ApiKeyResponse | null;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const deleteApiKey = useDeleteApiKey();

  function handleDelete() {
    if (!target) return;
    deleteApiKey.mutate(target.id, {
      onSuccess: () => {
        onOpenChange(false);
        toast.success(t('apiKeys.keyRevoked'));
      },
    });
  }

  return (
    <AlertDialog
      open={target !== null}
      onOpenChange={open => {
        if (!open) onOpenChange(false);
      }}
    >
      <AlertDialogContent variant="destructive">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('apiKeys.revokeTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('apiKeys.revokeConfirm', { name: target?.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteApiKey.isPending}
          >
            {deleteApiKey.isPending
              ? t('apiKeys.revoking')
              : t('apiKeys.revokeKey')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EmptyState({ onCreateClick }: { readonly onCreateClick: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="gradient-bg text-white flex size-16 items-center justify-center rounded-full mb-4">
        <Key className="size-8" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{t('apiKeys.noKeys')}</h3>
      <p className="text-muted-foreground mb-6 text-sm">
        {t('apiKeys.noKeysDesc')}
      </p>
      <Button
        onClick={onCreateClick}
        className="gradient-bg text-white hover:opacity-90 cursor-pointer"
      >
        <Plus className="mr-2 size-4" />
        {t('apiKeys.createKey')}
      </Button>
    </div>
  );
}

function UsageDocs() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const domain = window.location.origin;
  const curlExample = `curl ${domain}/v1/chat/completions \\
  -H "Authorization: Bearer sk-agx-..." \\
  -H "Content-Type: application/json" \\
  -d '{"model":"<agent-id>","messages":[{"role":"user","content":"Hello"}]}'`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(curlExample);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in non-HTTPS contexts
    }
  }

  return (
    <div className="rounded-lg border p-6">
      <h3 className="mb-2 text-lg font-semibold">{t('apiKeys.usage')}</h3>
      <p className="text-muted-foreground mb-4 text-sm">
        {t('apiKeys.usageDesc')}
      </p>
      <div className="relative">
        <pre className="bg-muted overflow-x-auto rounded-md p-4 font-mono text-sm">
          {curlExample}
        </pre>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 size-8"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="size-4 text-green-600" />
          ) : (
            <ClipboardCopy className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default function ApiKeysPage() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const { data: apiKeys, isLoading, error } = useApiKeys();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyResponse | null>(null);

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
          {t('common.failedToLoad', { resource: t('apiKeys.title') })}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t('common.tryRefreshing')}
        </p>
      </div>
    );
  }

  const hasKeys = apiKeys && apiKeys.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('apiKeys.title')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('apiKeys.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gradient-bg text-white hover:opacity-90 cursor-pointer"
        >
          <Plus className="mr-2 size-4" />
          {t('apiKeys.createKey')}
        </Button>
      </div>

      {/* Table or Empty State */}
      {hasKeys ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('apiKeys.key')}</TableHead>
                <TableHead>{t('apiKeys.agent')}</TableHead>
                <TableHead>{t('apiKeys.lastUsed')}</TableHead>
                <TableHead>{t('apiKeys.expires')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="w-20">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map(apiKey => (
                <TableRow key={apiKey.id}>
                  <TableCell className="font-medium">{apiKey.name}</TableCell>
                  <TableCell>
                    <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                      {apiKey.key}
                    </code>
                  </TableCell>
                  <TableCell>
                    {apiKey.agent ? (
                      <span>{apiKey.agent.name}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        {t('apiKeys.any')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDate(apiKey.lastUsedAt, dateLocale)}
                  </TableCell>
                  <TableCell>
                    {formatDate(apiKey.expiresAt, dateLocale)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      isActive={apiKey.isActive}
                      expiresAt={apiKey.expiresAt}
                    />
                  </TableCell>
                  <TableCell>
                    {apiKey.isActive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(apiKey)}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">{t('apiKeys.revoke')}</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState onCreateClick={() => setCreateOpen(true)} />
      )}

      {/* Usage docs */}
      <UsageDocs />

      {/* Create key dialog */}
      <CreateKeyDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        target={deleteTarget}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
}

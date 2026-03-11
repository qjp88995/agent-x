import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Locale } from 'date-fns';
import { format } from 'date-fns';
import { AlertTriangle, Key, Plus, Trash2 } from 'lucide-react';

import { CreateKeyDialog } from '@/components/api-keys/create-key-dialog';
import { DeleteConfirmDialog } from '@/components/api-keys/delete-confirm-dialog';
import { UsageDocs } from '@/components/api-keys/usage-docs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ApiKeyResponse } from '@/hooks/use-api-keys';
import { useApiKeys } from '@/hooks/use-api-keys';
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
      <Button onClick={onCreateClick} variant="primary">
        <Plus className="mr-2 size-4" />
        {t('apiKeys.createKey')}
      </Button>
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          variant="primary"
          className="sm:shrink-0"
        >
          <Plus className="mr-2 size-4" />
          {t('apiKeys.createKey')}
        </Button>
      </div>

      {hasKeys ? (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('apiKeys.key')}</TableHead>
                <TableHead className="hidden sm:table-cell">
                  {t('apiKeys.agent')}
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  {t('apiKeys.lastUsed')}
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  {t('apiKeys.expires')}
                </TableHead>
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
                  <TableCell className="hidden sm:table-cell">
                    {apiKey.agent ? (
                      <span>{apiKey.agent.name}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        {t('apiKeys.any')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatDate(apiKey.lastUsedAt, dateLocale)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
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
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost-destructive"
                            size="icon"
                            className="size-8"
                            onClick={() => setDeleteTarget(apiKey)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('apiKeys.revoke')}</TooltipContent>
                      </Tooltip>
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

      <UsageDocs />

      <CreateKeyDialog open={createOpen} onOpenChange={setCreateOpen} />

      <DeleteConfirmDialog
        target={deleteTarget}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
}

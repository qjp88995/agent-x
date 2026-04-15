import { useTranslation } from 'react-i18next';

import {
  Badge,
  Button,
  type Column,
  DataTable,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@agent-x/design';
import type { Locale } from 'date-fns';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

import { useDateLocale } from '@/hooks/use-date-locale';

import type { ApiKeyWithStatus } from './types';

function formatDate(dateStr: string | null, locale: Locale): string {
  if (!dateStr) return '-';
  return format(new Date(dateStr), 'PPP', { locale });
}

function StatusBadge({ status }: { readonly status: string }) {
  const { t } = useTranslation();

  if (status === 'revoked') {
    return <Badge variant="destructive">{t('apiKeys.revoked')}</Badge>;
  }

  if (status === 'expired') {
    return <Badge variant="warning">{t('apiKeys.expired')}</Badge>;
  }

  return <Badge variant="success">{t('common.active')}</Badge>;
}

interface ApiKeyTableProps {
  readonly apiKeys: ApiKeyWithStatus[];
  readonly onRevoke: (apiKey: ApiKeyWithStatus) => void;
  readonly loading?: boolean;
}

export function ApiKeyTable({ apiKeys, onRevoke, loading }: ApiKeyTableProps) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();

  const columns: Column<ApiKeyWithStatus>[] = [
    {
      key: 'name',
      header: t('common.name'),
      render: apiKey => (
        <span className="font-medium text-foreground">{apiKey.name}</span>
      ),
    },
    {
      key: 'key',
      header: t('apiKeys.key'),
      hideOnMobile: true,
      render: apiKey => (
        <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">
          {apiKey.key}
        </code>
      ),
    },
    {
      key: 'agent',
      header: t('apiKeys.agent'),
      width: '140px',
      hideOnMobile: true,
      render: apiKey =>
        apiKey.agent ? (
          <span className="text-sm">{apiKey.agent.name}</span>
        ) : (
          <span className="text-xs text-foreground-ghost">
            {t('apiKeys.any')}
          </span>
        ),
    },
    {
      key: 'lastUsed',
      header: t('apiKeys.lastUsed'),
      width: '160px',
      hideOnMobile: true,
      render: apiKey => (
        <span className="text-sm text-foreground-muted">
          {formatDate(apiKey.lastUsedAt, dateLocale)}
        </span>
      ),
    },
    {
      key: 'expires',
      header: t('apiKeys.expires'),
      width: '160px',
      hideOnMobile: true,
      render: apiKey => (
        <span className="text-sm text-foreground-muted">
          {formatDate(apiKey.expiresAt, dateLocale)}
        </span>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      width: '120px',
      render: apiKey => <StatusBadge status={apiKey.status} />,
    },
  ];

  function rowActions(apiKey: ApiKeyWithStatus) {
    if (!apiKey.isActive) return null;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost-destructive"
            size="icon"
            className="size-7"
            onClick={e => {
              e.stopPropagation();
              onRevoke(apiKey);
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('apiKeys.revoke')}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <DataTable<ApiKeyWithStatus>
      columns={columns}
      data={apiKeys}
      keyExtractor={apiKey => apiKey.id}
      rowActions={rowActions}
      loading={loading}
      emptyState={<span>{t('apiKeys.noKeys')}</span>}
    />
  );
}

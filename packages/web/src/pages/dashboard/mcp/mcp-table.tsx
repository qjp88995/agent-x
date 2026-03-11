import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import {
  Badge,
  Button,
  type Column,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@agent-x/design';
import type { McpServerResponse } from '@agent-x/shared';
import { McpType } from '@agent-x/shared';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { TransportBadge } from '@/components/mcp/transport-badge';
import { cn } from '@/lib/utils';

const TYPE_BADGE_CONFIG: Record<
  string,
  { labelKey: string; className: string }
> = {
  [McpType.OFFICIAL]: {
    labelKey: 'mcp.marketplace',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  [McpType.CUSTOM]: {
    labelKey: 'mcp.myServers',
    className:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
};

function TypeBadge({ type }: { readonly type: string }) {
  const { t } = useTranslation();
  const config = TYPE_BADGE_CONFIG[type];
  if (!config) return null;
  return (
    <Badge variant="outline" className={cn('border-0', config.className)}>
      {t(config.labelKey)}
    </Badge>
  );
}

interface McpTableProps {
  readonly servers: McpServerResponse[];
  readonly isAdmin: boolean;
  readonly onDelete: (server: McpServerResponse) => void;
}

export function McpTable({ servers, isAdmin, onDelete }: McpTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const columns: Column<McpServerResponse>[] = [
    {
      key: 'name',
      header: t('common.name'),
      render: server => (
        <span className="text-foreground text-sm font-medium">
          {server.name}
        </span>
      ),
    },
    {
      key: 'type',
      header: t('common.type', { defaultValue: 'Type' }),
      width: '130px',
      render: server => <TypeBadge type={server.type} />,
    },
    {
      key: 'transport',
      header: t('mcp.transport', { defaultValue: 'Transport' }),
      width: '160px',
      render: server => <TransportBadge transport={server.transport} />,
    },
    {
      key: 'description',
      header: t('common.description', { defaultValue: 'Description' }),
      render: server =>
        server.description ? (
          <span className="text-foreground-muted line-clamp-1 text-sm">
            {server.description}
          </span>
        ) : (
          <span className="text-foreground-muted/50 text-sm italic">
            {t('common.noDescription')}
          </span>
        ),
    },
  ];

  function rowActions(server: McpServerResponse) {
    const isCustom = server.type === McpType.CUSTOM;
    const isOfficialAdmin = server.type === McpType.OFFICIAL && isAdmin;
    const canDelete = isCustom || isOfficialAdmin;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">{t('common.actions')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isCustom && (
            <DropdownMenuItem
              onClick={() => navigate(`/mcp-servers/${server.id}/edit`)}
            >
              <Pencil className="mr-2 size-4" />
              {t('common.edit')}
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(server)}
            >
              <Trash2 className="mr-2 size-4" />
              {t('common.delete')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DataTable<McpServerResponse>
      columns={columns}
      data={servers}
      keyExtractor={server => server.id}
      onRowClick={server =>
        server.type === McpType.CUSTOM
          ? navigate(`/mcp-servers/${server.id}/edit`)
          : undefined
      }
      rowActions={rowActions}
      emptyState={
        <span>
          {t('mcp.noServers', { defaultValue: 'No MCP servers found.' })}
        </span>
      }
    />
  );
}

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import {
  Avatar,
  Badge,
  Button,
  type Column,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
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
  readonly loading?: boolean;
}

export function McpTable({
  servers,
  isAdmin,
  onDelete,
  loading,
}: McpTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const columns: Column<McpServerResponse>[] = [
    {
      key: 'name',
      header: t('common.name'),
      render: server => (
        <div className="flex items-center gap-2.5">
          <Avatar name={server.name} size="md" />
          <div>
            <div className="text-sm font-medium text-foreground">
              {server.name}
            </div>
            {server.description && (
              <div className="text-[10px] text-foreground-ghost line-clamp-1">
                {server.description}
              </div>
            )}
          </div>
        </div>
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
  ];

  function rowActions(server: McpServerResponse) {
    const isCustom = server.type === McpType.CUSTOM;
    const isOfficialAdmin = server.type === McpType.OFFICIAL && isAdmin;
    const canDelete = isCustom || isOfficialAdmin;

    return (
      <div className="flex items-center gap-1">
        {isCustom && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={e => {
                  e.stopPropagation();
                  navigate(`/mcp-servers/${server.id}/edit`);
                }}
              >
                <Pencil className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('common.edit')}</TooltipContent>
          </Tooltip>
        )}
        {canDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={e => e.stopPropagation()}
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">{t('common.actions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onClick={e => {
                  e.stopPropagation();
                  onDelete(server);
                }}
              >
                <Trash2 className="mr-2 size-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
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
      loading={loading}
      emptyState={
        <span>
          {t('mcp.noServers', { defaultValue: 'No MCP servers found.' })}
        </span>
      }
    />
  );
}

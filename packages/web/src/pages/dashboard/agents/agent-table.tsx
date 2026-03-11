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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@agent-x/design';
import type {
  AgentResponse,
  AgentStatus as AgentStatusType,
} from '@agent-x/shared';
import { AgentStatus } from '@agent-x/shared';
import { Archive, ArchiveRestore, MoreHorizontal, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';

const STATUS_BADGE_CONFIG: Record<
  AgentStatusType,
  { labelKey: string; className: string }
> = {
  ACTIVE: {
    labelKey: 'agents.active',
    className: 'bg-primary/10 text-primary',
  },
  ARCHIVED: {
    labelKey: 'agents.archived',
    className: 'bg-foreground-ghost/20 text-foreground-ghost',
  },
};

function StatusBadge({ status }: { readonly status: AgentStatusType }) {
  const { t } = useTranslation();
  const config = STATUS_BADGE_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[10px] px-2 py-0.5 text-[10px] font-medium',
        config.className
      )}
    >
      {t(config.labelKey)}
    </span>
  );
}

interface AgentTableProps {
  readonly agents: AgentResponse[];
  readonly onDelete: (agent: AgentResponse) => void;
  readonly onArchive: (agent: AgentResponse) => void;
  readonly onUnarchive: (agent: AgentResponse) => void;
}

export function AgentTable({
  agents,
  onDelete,
  onArchive,
  onUnarchive,
}: AgentTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const columns: Column<AgentResponse>[] = [
    {
      key: 'name',
      header: t('common.name'),
      render: agent => (
        <div className="flex items-center gap-3">
          <Avatar name={agent.name} size="sm" />
          <div className="flex flex-col gap-0.5">
            <span className="text-foreground text-sm font-medium">
              {agent.name}
            </span>
            {agent.description && (
              <span className="text-foreground-muted line-clamp-1 text-xs">
                {agent.description}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'model',
      header: t('agents.model'),
      width: '200px',
      render: agent => (
        <Badge variant="outline" className="text-xs font-mono">
          {agent.modelId}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      width: '120px',
      render: agent => <StatusBadge status={agent.status} />,
    },
  ];

  function rowActions(agent: AgentResponse) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">{t('common.actions')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {agent.status === AgentStatus.ACTIVE && (
            <>
              <DropdownMenuItem onClick={() => onArchive(agent)}>
                <Archive className="mr-2 size-4" />
                {t('agents.archive')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(agent)}
              >
                <Trash2 className="mr-2 size-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            </>
          )}
          {agent.status === AgentStatus.ARCHIVED && (
            <DropdownMenuItem onClick={() => onUnarchive(agent)}>
              <ArchiveRestore className="mr-2 size-4" />
              {t('agents.unarchive')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DataTable<AgentResponse>
      columns={columns}
      data={agents}
      keyExtractor={agent => agent.id}
      onRowClick={agent => navigate(`/agents/${agent.id}/edit`)}
      rowActions={rowActions}
      emptyState={<span>{t('agents.noAgents')}</span>}
    />
  );
}

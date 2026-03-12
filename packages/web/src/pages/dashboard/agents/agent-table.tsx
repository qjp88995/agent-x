import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@agent-x/design';
import type { AgentResponse } from '@agent-x/shared';
import { AgentStatus } from '@agent-x/shared';
import {
  Archive,
  ArchiveRestore,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';

interface AgentTableProps {
  readonly agents: AgentResponse[];
  readonly onDelete: (agent: AgentResponse) => void;
  readonly onArchive: (agent: AgentResponse) => void;
  readonly onUnarchive: (agent: AgentResponse) => void;
  readonly loading?: boolean;
}

export function AgentTable({
  agents,
  onDelete,
  onArchive,
  onUnarchive,
  loading,
}: AgentTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const columns: Column<AgentResponse>[] = [
    {
      key: 'name',
      header: t('common.name'),
      render: agent => (
        <div className="flex items-center gap-3">
          <Avatar name={agent.name} size="md" />
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
      render: agent => (
        <Badge
          variant={agent.status === AgentStatus.ACTIVE ? 'success' : 'muted'}
        >
          {agent.status === AgentStatus.ACTIVE
            ? t('agents.active')
            : t('agents.archived')}
        </Badge>
      ),
    },
  ];

  function rowActions(agent: AgentResponse) {
    return (
      <div className="flex items-center gap-1">
        {agent.status === AgentStatus.ACTIVE && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={e => e.stopPropagation()}
                  asChild
                >
                  <Link to={`/chat?agent=${agent.id}`}>
                    <MessageSquare className="size-3.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('agents.chat')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={e => {
                    e.stopPropagation();
                    navigate(`/agents/${agent.id}/edit`);
                  }}
                >
                  <Pencil className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('common.edit')}</TooltipContent>
            </Tooltip>
          </>
        )}
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
      </div>
    );
  }

  return (
    <DataTable<AgentResponse>
      columns={columns}
      data={agents}
      keyExtractor={agent => agent.id}
      onRowClick={agent => navigate(`/agents/${agent.id}/edit`)}
      rowActions={rowActions}
      loading={loading}
      emptyState={<span>{t('agents.noAgents')}</span>}
    />
  );
}

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type {
  AgentResponse,
  AgentStatus as AgentStatusType,
} from '@agent-x/shared';
import { AgentStatus } from '@agent-x/shared';
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  Bot,
  Check,
  ClipboardCopy,
  History,
  MessageSquare,
  MoreHorizontal,
  Pencil,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useAgents,
  useArchiveAgent,
  useDeleteAgent,
  useUnarchiveAgent,
} from '@/hooks/use-agents';
import { cn } from '@/lib/utils';

function CopyableId({ id }: { readonly id: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in non-HTTPS contexts
    }
  }

  const shortId = id.slice(0, 8);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-mono text-xs transition-colors cursor-pointer"
        >
          <span>{shortId}</span>
          {copied ? (
            <Check className="size-3 text-green-600" />
          ) : (
            <ClipboardCopy className="size-3" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {copied ? t('common.copied') : `${t('common.copy')} ID: ${id}`}
      </TooltipContent>
    </Tooltip>
  );
}

const STATUS_BADGE_CONFIG: Record<
  AgentStatusType,
  { labelKey: string; className: string }
> = {
  ACTIVE: {
    labelKey: 'agents.active',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  ARCHIVED: {
    labelKey: 'agents.archived',
    className:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  },
};

type FilterTab = 'all' | AgentStatusType;

function StatusBadge({ status }: { readonly status: AgentStatusType }) {
  const { t } = useTranslation();
  const config = STATUS_BADGE_CONFIG[status];
  return (
    <Badge variant="outline" className={cn('border-0', config.className)}>
      {t(config.labelKey)}
    </Badge>
  );
}

function getAgentInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function AgentCard({
  agent,
  onDelete,
  onArchive,
  onUnarchive,
}: {
  readonly agent: AgentResponse;
  readonly onDelete: (agent: AgentResponse) => void;
  readonly onArchive: (agent: AgentResponse) => void;
  readonly onUnarchive: (agent: AgentResponse) => void;
}) {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback className="gradient-bg text-white text-sm font-semibold">
              {getAgentInitial(agent.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">{agent.name}</CardTitle>
            <div className="flex items-center gap-2">
              <StatusBadge status={agent.status} />
              {agent.latestVersion !== null && (
                <span className="text-muted-foreground text-xs">
                  v{agent.latestVersion}
                </span>
              )}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
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
      </CardHeader>

      <CardContent className="flex-1">
        {agent.description ? (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {agent.description}
          </p>
        ) : (
          <p className="text-muted-foreground/50 text-sm italic">
            {t('common.noDescription')}
          </p>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="flex w-full items-center justify-between">
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <CopyableId id={agent.id} />
            <span className="text-muted-foreground/30">|</span>
            <span>{agent.modelId}</span>
          </div>
          <div className="flex items-center gap-1">
            {agent.status === AgentStatus.ACTIVE && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 cursor-pointer"
                    asChild
                  >
                    <Link to={`/chat?agent=${agent.id}`}>
                      <MessageSquare className="size-3.5" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('agents.chat')}</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 cursor-pointer"
                  asChild
                >
                  <Link to={`/agents/${agent.id}/versions`}>
                    <History className="size-3.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('agents.versionManagement')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 cursor-pointer"
                  asChild
                >
                  <Link to={`/agents/${agent.id}/edit`}>
                    <Pencil className="size-3.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('common.edit')}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

function EmptyState({ filter }: { readonly filter: FilterTab }) {
  const { t } = useTranslation();
  const message =
    filter === 'all'
      ? t('agents.noAgentsDesc')
      : t('agents.noFilteredAgents', {
          filter: t(STATUS_BADGE_CONFIG[filter as AgentStatusType].labelKey),
        });

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="gradient-bg text-white flex size-16 items-center justify-center rounded-full mb-4">
        <Bot className="size-8" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{t('agents.noAgents')}</h3>
      <p className="text-muted-foreground mb-6 text-sm">{message}</p>
      {filter === 'all' && (
        <Button asChild variant="primary">
          <Link to="/agents/new">
            <Plus className="mr-2 size-4" />
            {t('agents.createAgent')}
          </Link>
        </Button>
      )}
    </div>
  );
}

export default function AgentListPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const { data: allAgents, isLoading, error } = useAgents();

  const agents = useMemo(
    () =>
      activeTab === 'all'
        ? allAgents
        : allAgents?.filter(a => a.status === activeTab),
    [allAgents, activeTab]
  );
  const deleteAgent = useDeleteAgent();
  const archiveAgent = useArchiveAgent();
  const unarchiveAgent = useUnarchiveAgent();
  const [deleteTarget, setDeleteTarget] = useState<AgentResponse | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<AgentResponse | null>(
    null
  );

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteAgent.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success(t('agents.deleted'));
      },
    });
  }

  function handleArchiveConfirm() {
    if (!archiveTarget) return;
    archiveAgent.mutate(archiveTarget.id, {
      onSuccess: () => {
        setArchiveTarget(null);
        toast.success(t('agents.archiveSuccess'));
      },
    });
  }

  function handleUnarchive(agent: AgentResponse) {
    unarchiveAgent.mutate(agent.id, {
      onSuccess: () => {
        toast.success(t('agents.unarchiveSuccess'));
      },
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground text-sm">
          {t('agents.loadingAgents')}
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
            resource: t('agents.title').toLowerCase(),
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('agents.title')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('agents.subtitle')}
          </p>
        </div>
        <Button asChild variant="primary">
          <Link to="/agents/new">
            <Plus className="mr-2 size-4" />
            {t('agents.createAgent')}
          </Link>
        </Button>
      </div>

      {/* Filter tabs */}
      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as FilterTab)}
      >
        <TabsList>
          <TabsTrigger value="all">{t('agents.all')}</TabsTrigger>
          <TabsTrigger value={AgentStatus.ACTIVE}>
            {t('agents.active')}
          </TabsTrigger>
          <TabsTrigger value={AgentStatus.ARCHIVED}>
            {t('agents.archived')}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Agent grid or empty state */}
      {!agents || agents.length === 0 ? (
        <EmptyState filter={activeTab} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {agents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onDelete={setDeleteTarget}
              onArchive={setArchiveTarget}
              onUnarchive={handleUnarchive}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent variant="destructive">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('agents.deleteAgent')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('agents.deleteConfirm', { name: deleteTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteAgent.isPending}
            >
              {deleteAgent.isPending
                ? t('common.deleting')
                : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive confirmation dialog */}
      <AlertDialog
        open={archiveTarget !== null}
        onOpenChange={open => {
          if (!open) setArchiveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('agents.archiveAgent')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('agents.archiveConfirm', { name: archiveTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveConfirm}
              disabled={archiveAgent.isPending}
            >
              {t('agents.archive')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

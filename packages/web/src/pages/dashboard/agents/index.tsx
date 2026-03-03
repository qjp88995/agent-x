import { useState } from 'react';
import { Link } from 'react-router';
import {
  AlertTriangle,
  Archive,
  Bot,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Rocket,
  Trash2,
} from 'lucide-react';
import { AgentStatus } from '@agent-x/shared';
import type {
  AgentResponse,
  AgentStatus as AgentStatusType,
} from '@agent-x/shared';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  useAgents,
  useArchiveAgent,
  useDeleteAgent,
  usePublishAgent,
} from '@/hooks/use-agents';

const STATUS_BADGE_CONFIG: Record<
  AgentStatusType,
  { label: string; className: string }
> = {
  DRAFT: {
    label: 'Draft',
    className:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  PUBLISHED: {
    label: 'Published',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  ARCHIVED: {
    label: 'Archived',
    className:
      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  },
};

type FilterTab = 'all' | AgentStatusType;

function StatusBadge({ status }: { readonly status: AgentStatusType }) {
  const config = STATUS_BADGE_CONFIG[status];
  return (
    <Badge variant="outline" className={cn('border-0', config.className)}>
      {config.label}
    </Badge>
  );
}

function getAgentInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function AgentCard({
  agent,
  onDelete,
  onPublish,
  onArchive,
}: {
  readonly agent: AgentResponse;
  readonly onDelete: (agent: AgentResponse) => void;
  readonly onPublish: (agent: AgentResponse) => void;
  readonly onArchive: (agent: AgentResponse) => void;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex items-center gap-3">
          <Avatar className="size-10">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {getAgentInitial(agent.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <CardTitle className="text-base">{agent.name}</CardTitle>
            <div className="flex items-center gap-2">
              <StatusBadge status={agent.status} />
              <span className="text-muted-foreground text-xs">
                v{agent.version}
              </span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/agents/${agent.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            {agent.status === AgentStatus.DRAFT && (
              <DropdownMenuItem onClick={() => onPublish(agent)}>
                <Rocket className="mr-2 size-4" />
                Publish
              </DropdownMenuItem>
            )}
            {agent.status === AgentStatus.PUBLISHED && (
              <>
                <DropdownMenuItem onClick={() => onArchive(agent)}>
                  <Archive className="mr-2 size-4" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/agents/${agent.id}/chat`}>
                    <MessageSquare className="mr-2 size-4" />
                    Chat
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            {agent.status === AgentStatus.DRAFT && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(agent)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </>
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
            No description
          </p>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="text-muted-foreground text-xs">{agent.modelId}</div>
      </CardFooter>
    </Card>
  );
}

function EmptyState({ filter }: { readonly filter: FilterTab }) {
  const message =
    filter === 'all'
      ? 'Create your first AI agent to get started.'
      : `No ${filter.toLowerCase()} agents found.`;

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <Bot className="text-muted-foreground mb-4 size-12" />
      <h3 className="mb-1 text-lg font-semibold">No agents yet</h3>
      <p className="text-muted-foreground mb-6 text-sm">{message}</p>
      {filter === 'all' && (
        <Button asChild>
          <Link to="/agents/new">
            <Plus className="mr-2 size-4" />
            Create Agent
          </Link>
        </Button>
      )}
    </div>
  );
}

export default function AgentListPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const statusFilter =
    activeTab === 'all' ? undefined : (activeTab as AgentStatusType);
  const { data: agents, isLoading, error } = useAgents(statusFilter);
  const deleteAgent = useDeleteAgent();
  const publishAgent = usePublishAgent();
  const archiveAgent = useArchiveAgent();
  const [deleteTarget, setDeleteTarget] = useState<AgentResponse | null>(null);

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteAgent.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
      },
    });
  }

  function handlePublish(agent: AgentResponse) {
    publishAgent.mutate(agent.id);
  }

  function handleArchive(agent: AgentResponse) {
    archiveAgent.mutate(agent.id);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground text-sm">Loading agents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">Failed to load agents</h3>
        <p className="text-muted-foreground text-sm">
          Please try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
          <p className="text-muted-foreground text-sm">
            Create and manage your AI agents.
          </p>
        </div>
        <Button asChild>
          <Link to="/agents/new">
            <Plus className="mr-2 size-4" />
            Create Agent
          </Link>
        </Button>
      </div>

      {/* Filter tabs */}
      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as FilterTab)}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value={AgentStatus.DRAFT}>Draft</TabsTrigger>
          <TabsTrigger value={AgentStatus.PUBLISHED}>Published</TabsTrigger>
          <TabsTrigger value={AgentStatus.ARCHIVED}>Archived</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Agent grid or empty state */}
      {!agents || agents.length === 0 ? (
        <EmptyState filter={activeTab} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onDelete={setDeleteTarget}
              onPublish={handlePublish}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}
              &rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteAgent.isPending}
            >
              {deleteAgent.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

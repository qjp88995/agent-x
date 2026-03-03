import { useState } from 'react';
import { Link } from 'react-router';
import {
  AlertTriangle,
  MoreHorizontal,
  Pencil,
  PlugZap,
  Plus,
  Server,
  Trash2,
} from 'lucide-react';
import type { McpServerResponse, McpTransport as McpTransportType } from '@agent-x/shared';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  useDeleteMcpServer,
  useMcpMarket,
  useMcpServers,
  useTestMcpServer,
} from '@/hooks/use-mcp';

const TRANSPORT_BADGE_CONFIG: Record<
  McpTransportType,
  { label: string; className: string }
> = {
  STDIO: {
    label: 'STDIO',
    className:
      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  },
  SSE: {
    label: 'SSE',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  STREAMABLE_HTTP: {
    label: 'HTTP',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
};

function TransportBadge({
  transport,
}: {
  readonly transport: McpTransportType;
}) {
  const config = TRANSPORT_BADGE_CONFIG[transport];
  return (
    <Badge variant="outline" className={cn('border-0', config.className)}>
      {config.label}
    </Badge>
  );
}

function TestResultBanner({
  message,
  success,
  onDismiss,
}: {
  readonly message: string;
  readonly success: boolean;
  readonly onDismiss: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-md px-4 py-3 text-sm',
        success
          ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      )}
    >
      <span>{message}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDismiss}
        className="h-auto px-2 py-1 text-xs"
      >
        Dismiss
      </Button>
    </div>
  );
}

function MarketplaceCard({
  server,
}: {
  readonly server: McpServerResponse;
}) {
  const toolCount = server.tools?.length ?? 0;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base">{server.name}</CardTitle>
          <TransportBadge transport={server.transport} />
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {server.description ? (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {server.description}
          </p>
        ) : (
          <p className="text-muted-foreground/50 text-sm italic">
            No description
          </p>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="text-muted-foreground text-sm">
          {toolCount} tool{toolCount !== 1 ? 's' : ''}
        </div>
      </CardFooter>
    </Card>
  );
}

function McpServerCard({
  server,
  onDelete,
  onTestResult,
}: {
  readonly server: McpServerResponse;
  readonly onDelete: (server: McpServerResponse) => void;
  readonly onTestResult: (message: string, success: boolean) => void;
}) {
  const testMcpServer = useTestMcpServer();
  const toolCount = server.tools?.length ?? 0;

  function handleTest() {
    testMcpServer.mutate(server.id, {
      onSuccess: (result) => {
        onTestResult(result.message, result.success);
      },
      onError: () => {
        onTestResult(
          'Connection test failed. Check your configuration.',
          false,
        );
      },
    });
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base">{server.name}</CardTitle>
          <TransportBadge transport={server.transport} />
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
              <Link to={`/mcp-servers/${server.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleTest}
              disabled={testMcpServer.isPending}
            >
              <PlugZap className="mr-2 size-4" />
              {testMcpServer.isPending ? 'Testing...' : 'Test Connection'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(server)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="flex-1">
        {server.description ? (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {server.description}
          </p>
        ) : (
          <p className="text-muted-foreground/50 text-sm italic">
            No description
          </p>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="text-muted-foreground text-sm">
          {toolCount > 0
            ? `${toolCount} tool${toolCount !== 1 ? 's' : ''}`
            : 'No tools detected'}
        </div>
      </CardFooter>
    </Card>
  );
}

function EmptyState({
  tab,
}: {
  readonly tab: 'marketplace' | 'custom';
}) {
  const isMarketplace = tab === 'marketplace';

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <Server className="text-muted-foreground mb-4 size-12" />
      <h3 className="mb-1 text-lg font-semibold">
        {isMarketplace ? 'No marketplace servers' : 'No custom servers yet'}
      </h3>
      <p className="text-muted-foreground mb-6 text-sm">
        {isMarketplace
          ? 'Marketplace MCP servers will appear here when available.'
          : 'Add your first MCP server to get started.'}
      </p>
      {!isMarketplace && (
        <Button asChild>
          <Link to="/mcp-servers/new">
            <Plus className="mr-2 size-4" />
            Add Server
          </Link>
        </Button>
      )}
    </div>
  );
}

export default function McpPage() {
  const {
    data: marketServers,
    isLoading: isLoadingMarket,
    error: marketError,
  } = useMcpMarket();
  const {
    data: customServers,
    isLoading: isLoadingCustom,
    error: customError,
  } = useMcpServers();
  const deleteMcpServer = useDeleteMcpServer();
  const [deleteTarget, setDeleteTarget] = useState<McpServerResponse | null>(
    null,
  );
  const [testResult, setTestResult] = useState<{
    message: string;
    success: boolean;
  } | null>(null);

  const isLoading = isLoadingMarket || isLoadingCustom;
  const error = marketError ?? customError;

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMcpServer.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
      },
    });
  }

  function handleTestResult(message: string, success: boolean) {
    setTestResult({ message, success });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground text-sm">
          Loading MCP servers...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">Failed to load MCP servers</h3>
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
          <h1 className="text-2xl font-bold tracking-tight">MCP Servers</h1>
          <p className="text-muted-foreground text-sm">
            Manage Model Context Protocol server connections.
          </p>
        </div>
        <Button asChild>
          <Link to="/mcp-servers/new">
            <Plus className="mr-2 size-4" />
            Add Server
          </Link>
        </Button>
      </div>

      {/* Test result banner */}
      {testResult && (
        <TestResultBanner
          message={testResult.message}
          success={testResult.success}
          onDismiss={() => setTestResult(null)}
        />
      )}

      {/* Tabs */}
      <Tabs defaultValue="marketplace">
        <TabsList>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="custom">My Servers</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace">
          {!marketServers || marketServers.length === 0 ? (
            <EmptyState tab="marketplace" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {marketServers.map((server) => (
                <MarketplaceCard key={server.id} server={server} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="custom">
          {!customServers || customServers.length === 0 ? (
            <EmptyState tab="custom" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {customServers.map((server) => (
                <McpServerCard
                  key={server.id}
                  server={server}
                  onDelete={setDeleteTarget}
                  onTestResult={handleTestResult}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete MCP Server</DialogTitle>
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
              disabled={deleteMcpServer.isPending}
            >
              {deleteMcpServer.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

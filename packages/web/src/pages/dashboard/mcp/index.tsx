import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type {
  McpServerResponse,
  McpTransport as McpTransportType,
} from '@agent-x/shared';
import {
  AlertTriangle,
  MoreHorizontal,
  Pencil,
  PlugZap,
  Plus,
  Server,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

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
import { useIsAdmin } from '@/hooks/use-auth';
import {
  useDeleteMarketplaceMcpServer,
  useDeleteMcpServer,
  useMcpMarket,
  useMcpServers,
  useTestMcpServer,
} from '@/hooks/use-mcp';
import { cn } from '@/lib/utils';

const TRANSPORT_BADGE_CONFIG: Record<McpTransportType, { className: string }> =
  {
    STDIO: {
      className:
        'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    },
    SSE: {
      className:
        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    },
    STREAMABLE_HTTP: {
      className:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    },
  };

const TRANSPORT_LABEL_KEY: Record<McpTransportType, string> = {
  STDIO: 'mcp.stdio',
  SSE: 'mcp.sse',
  STREAMABLE_HTTP: 'mcp.streamableHttp',
};

function TransportBadge({
  transport,
}: {
  readonly transport: McpTransportType;
}) {
  const { t } = useTranslation();
  const config = TRANSPORT_BADGE_CONFIG[transport];
  return (
    <Badge variant="outline" className={cn('border-0', config.className)}>
      {t(TRANSPORT_LABEL_KEY[transport])}
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
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-md px-4 py-3 text-sm',
        success
          ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      )}
    >
      <span>{message}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDismiss}
        className="h-auto px-2 py-1 text-xs"
      >
        {t('common.dismiss')}
      </Button>
    </div>
  );
}

function MarketplaceCard({
  server,
  isAdmin,
  onDelete,
  onTestResult,
}: {
  readonly server: McpServerResponse;
  readonly isAdmin: boolean;
  readonly onDelete: (server: McpServerResponse) => void;
  readonly onTestResult: (message: string, success: boolean) => void;
}) {
  const { t } = useTranslation();
  const testMcpServer = useTestMcpServer();
  const toolCount = server.tools?.length ?? 0;

  function handleTest() {
    testMcpServer.mutate(server.id, {
      onSuccess: result => {
        onTestResult(result.message, result.success);
      },
      onError: () => {
        onTestResult(t('mcp.testFailed'), false);
      },
    });
  }

  return (
    <Card className="flex flex-col hover:shadow-md hover:border-primary/20 transition-all duration-200">
      <CardHeader
        className={
          isAdmin
            ? 'flex flex-row items-start justify-between gap-2 space-y-0'
            : undefined
        }
      >
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base">{server.name}</CardTitle>
          <TransportBadge transport={server.transport} />
        </div>
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">{t('common.actions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/mcp-servers/${server.id}/edit?type=official`}>
                  <Pencil className="mr-2 size-4" />
                  {t('common.edit')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleTest}
                disabled={testMcpServer.isPending}
              >
                <PlugZap className="mr-2 size-4" />
                {testMcpServer.isPending
                  ? t('mcp.testing')
                  : t('mcp.testConnection')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(server)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        {server.description ? (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {server.description}
          </p>
        ) : (
          <p className="text-muted-foreground/50 text-sm italic">
            {t('common.noDescription')}
          </p>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="text-muted-foreground text-sm">
          {t('mcp.toolCount', { count: toolCount })}
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
  const { t } = useTranslation();
  const testMcpServer = useTestMcpServer();
  const toolCount = server.tools?.length ?? 0;

  function handleTest() {
    testMcpServer.mutate(server.id, {
      onSuccess: result => {
        onTestResult(result.message, result.success);
      },
      onError: () => {
        onTestResult(t('mcp.testFailed'), false);
      },
    });
  }

  return (
    <Card className="flex flex-col hover:shadow-md hover:border-primary/20 transition-all duration-200">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base">{server.name}</CardTitle>
          <TransportBadge transport={server.transport} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">{t('common.actions')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/mcp-servers/${server.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                {t('common.edit')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleTest}
              disabled={testMcpServer.isPending}
            >
              <PlugZap className="mr-2 size-4" />
              {testMcpServer.isPending
                ? t('mcp.testing')
                : t('mcp.testConnection')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(server)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              {t('common.delete')}
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
            {t('common.noDescription')}
          </p>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="text-muted-foreground text-sm">
          {toolCount > 0
            ? t('mcp.toolCount', { count: toolCount })
            : t('mcp.noTools')}
        </div>
      </CardFooter>
    </Card>
  );
}

function EmptyState({
  tab,
  isAdmin,
}: {
  readonly tab: 'marketplace' | 'custom';
  readonly isAdmin: boolean;
}) {
  const { t } = useTranslation();
  const isMarketplace = tab === 'marketplace';

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="gradient-bg text-white flex size-16 items-center justify-center rounded-full mb-4">
        <Server className="size-8" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">
        {isMarketplace ? t('mcp.noMarketplace') : t('mcp.noCustom')}
      </h3>
      <p className="text-muted-foreground mb-6 text-sm">
        {isMarketplace ? t('mcp.noMarketplaceDesc') : t('mcp.noCustomDesc')}
      </p>
      {isMarketplace && isAdmin && (
        <Button
          asChild
          className="gradient-bg text-white hover:opacity-90 cursor-pointer"
        >
          <Link to="/mcp-servers/new?type=official">
            <Plus className="mr-2 size-4" />
            {t('mcp.addToMarketplace')}
          </Link>
        </Button>
      )}
      {!isMarketplace && (
        <Button
          asChild
          className="gradient-bg text-white hover:opacity-90 cursor-pointer"
        >
          <Link to="/mcp-servers/new">
            <Plus className="mr-2 size-4" />
            {t('mcp.addServer')}
          </Link>
        </Button>
      )}
    </div>
  );
}

export default function McpPage() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
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
  const deleteMarketplaceMcpServer = useDeleteMarketplaceMcpServer();
  const [deleteTarget, setDeleteTarget] = useState<McpServerResponse | null>(
    null
  );
  const [deleteMode, setDeleteMode] = useState<'custom' | 'marketplace'>(
    'custom'
  );
  const [testResult, setTestResult] = useState<{
    message: string;
    success: boolean;
  } | null>(null);

  const isLoading = isLoadingMarket || isLoadingCustom;
  const error = marketError ?? customError;
  const isDeleting =
    deleteMcpServer.isPending || deleteMarketplaceMcpServer.isPending;

  function handleDeleteCustom(server: McpServerResponse) {
    setDeleteTarget(server);
    setDeleteMode('custom');
  }

  function handleDeleteMarketplace(server: McpServerResponse) {
    setDeleteTarget(server);
    setDeleteMode('marketplace');
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const mutation =
      deleteMode === 'marketplace'
        ? deleteMarketplaceMcpServer
        : deleteMcpServer;
    mutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success(t('mcp.deleted'));
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
          {t('common.failedToLoad', { resource: t('nav.mcpServers') })}
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
            {t('mcp.title')}
          </h1>
          <p className="text-muted-foreground text-sm">{t('mcp.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" asChild>
              <Link to="/mcp-servers/new?type=official">
                <Plus className="mr-2 size-4" />
                {t('mcp.addToMarketplace')}
              </Link>
            </Button>
          )}
          <Button
            asChild
            className="gradient-bg text-white hover:opacity-90 cursor-pointer"
          >
            <Link to="/mcp-servers/new">
              <Plus className="mr-2 size-4" />
              {t('mcp.addServer')}
            </Link>
          </Button>
        </div>
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
          <TabsTrigger value="marketplace">{t('mcp.marketplace')}</TabsTrigger>
          <TabsTrigger value="custom">{t('mcp.myServers')}</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace">
          {!marketServers || marketServers.length === 0 ? (
            <EmptyState tab="marketplace" isAdmin={isAdmin} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {marketServers.map(server => (
                <MarketplaceCard
                  key={server.id}
                  server={server}
                  isAdmin={isAdmin}
                  onDelete={handleDeleteMarketplace}
                  onTestResult={handleTestResult}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="custom">
          {!customServers || customServers.length === 0 ? (
            <EmptyState tab="custom" isAdmin={isAdmin} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {customServers.map(server => (
                <McpServerCard
                  key={server.id}
                  server={server}
                  onDelete={handleDeleteCustom}
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
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteMode === 'marketplace'
                ? t('mcp.deleteMarketplace')
                : t('mcp.deleteServer')}
            </DialogTitle>
            <DialogDescription>
              {deleteMode === 'marketplace'
                ? t('mcp.deleteMarketplaceConfirm', {
                    name: deleteTarget?.name,
                  })
                : t('mcp.deleteConfirm', { name: deleteTarget?.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('common.cancel')}</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

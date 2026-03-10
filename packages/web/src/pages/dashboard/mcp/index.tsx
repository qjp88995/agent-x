import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { McpServerResponse } from '@agent-x/shared';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { MarketplaceCard } from '@/components/mcp/marketplace-card';
import { McpEmptyState } from '@/components/mcp/mcp-empty-state';
import { McpServerCard } from '@/components/mcp/mcp-server-card';
import { AddCard } from '@/components/shared/add-card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsAdmin } from '@/hooks/use-auth';
import {
  useDeleteMarketplaceMcpServer,
  useDeleteMcpServer,
  useMcpMarket,
  useMcpServers,
} from '@/hooks/use-mcp';

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('mcp.title')}
          </h1>
          <p className="text-muted-foreground text-sm">{t('mcp.subtitle')}</p>
        </div>
      </div>

      <Tabs defaultValue="marketplace">
        <TabsList>
          <TabsTrigger value="marketplace">{t('mcp.marketplace')}</TabsTrigger>
          <TabsTrigger value="custom">{t('mcp.myServers')}</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace">
          {!marketServers?.length ? (
            <McpEmptyState tab="marketplace" isAdmin={isAdmin} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {isAdmin && (
                <AddCard
                  to="/mcp-servers/new?type=official"
                  label={t('mcp.addToMarketplace')}
                />
              )}
              {marketServers.map(server => (
                <MarketplaceCard
                  key={server.id}
                  server={server}
                  isAdmin={isAdmin}
                  onDelete={handleDeleteMarketplace}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="custom">
          {!customServers?.length ? (
            <McpEmptyState tab="custom" isAdmin={isAdmin} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <AddCard to="/mcp-servers/new" label={t('mcp.addServer')} />
              {customServers.map(server => (
                <McpServerCard
                  key={server.id}
                  server={server}
                  onDelete={handleDeleteCustom}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent variant="destructive">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteMode === 'marketplace'
                ? t('mcp.deleteMarketplace')
                : t('mcp.deleteServer')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteMode === 'marketplace'
                ? t('mcp.deleteMarketplaceConfirm', {
                    name: deleteTarget?.name,
                  })
                : t('mcp.deleteConfirm', { name: deleteTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  PageHeader,
  Skeleton,
  StaggerItem,
  StaggerList,
  ViewToggle,
} from '@agent-x/design';
import type { McpServerResponse } from '@agent-x/shared';
import { AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { McpEmptyState } from '@/components/mcp/mcp-empty-state';
import { McpServerCard } from '@/components/mcp/mcp-server-card';
import { useIsAdmin } from '@/hooks/use-auth';
import { useFilteredSearch } from '@/hooks/use-filtered-search';
import { useDeleteMcpServer, useMcpServers } from '@/hooks/use-mcp';
import { useViewMode } from '@/hooks/use-view-mode';

import { McpTable } from './mcp-table';

function McpCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20 rounded-full" />
      </CardHeader>
      <CardContent className="flex-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-1.5 h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

export default function McpPage() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const [view, setView] = useViewMode('mcp');

  const { data: customServers, isLoading, error } = useMcpServers();

  const deleteMcpServer = useDeleteMcpServer();
  const [deleteTarget, setDeleteTarget] = useState<McpServerResponse | null>(
    null
  );

  const isDeleting = deleteMcpServer.isPending;

  const { filtered } = useFilteredSearch<McpServerResponse>(
    customServers ?? [],
    {
      searchKeys: ['name', 'description'],
    }
  );

  function handleDelete(server: McpServerResponse) {
    setDeleteTarget(server);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMcpServer.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success(t('mcp.deleted'));
      },
    });
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">
          {t('common.failedToLoad', { resource: t('nav.mcpServers') })}
        </h3>
        <p className="text-foreground-muted text-sm">
          {t('common.tryRefreshing')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t('mcp.title')}
        description={t('mcp.subtitle')}
        search
        actions={
          <Button variant="primary" asChild>
            <Link to="/mcp-servers/new">
              <Plus />
              {t('mcp.createService')}
            </Link>
          </Button>
        }
      />

      <div className="flex h-10 shrink-0 items-center justify-end border-b border-border px-5">
        <ViewToggle value={view} onChange={setView} />
      </div>

      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          view === 'table' ? (
            <McpTable
              servers={[]}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              loading
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <McpCardSkeleton key={i} />
              ))}
            </div>
          )
        ) : !filtered.length ? (
          <>
            <McpEmptyState tab="custom" isAdmin={isAdmin} />
            <div className="mt-5 text-center">
              <Link
                to="/marketplace?tab=mcp"
                className="text-foreground-muted hover:text-foreground text-sm transition-colors"
              >
                {t('marketplace.browseMarketplace')} →
              </Link>
            </div>
          </>
        ) : view === 'table' ? (
          <>
            <McpTable
              servers={filtered}
              isAdmin={isAdmin}
              onDelete={handleDelete}
            />
            <div className="mt-5 text-center">
              <Link
                to="/marketplace?tab=mcp"
                className="text-foreground-muted hover:text-foreground text-sm transition-colors"
              >
                {t('marketplace.browseMarketplace')} →
              </Link>
            </div>
          </>
        ) : (
          <>
            <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map(server => (
                <StaggerItem key={server.id}>
                  <McpServerCard server={server} onDelete={handleDelete} />
                </StaggerItem>
              ))}
            </StaggerList>
            <div className="mt-5 text-center">
              <Link
                to="/marketplace?tab=mcp"
                className="text-foreground-muted hover:text-foreground text-sm transition-colors"
              >
                {t('marketplace.browseMarketplace')} →
              </Link>
            </div>
          </>
        )}
      </div>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent variant="destructive">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('mcp.deleteServer')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('mcp.deleteConfirm', { name: deleteTarget?.name })}
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

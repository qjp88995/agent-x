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
  PageHeader,
} from '@agent-x/design';
import type { McpServerResponse } from '@agent-x/shared';
import { AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { McpEmptyState } from '@/components/mcp/mcp-empty-state';
import { useIsAdmin } from '@/hooks/use-auth';
import { useFilteredSearch } from '@/hooks/use-filtered-search';
import { useDeleteMcpServer, useMcpServers } from '@/hooks/use-mcp';

import { McpTable } from './mcp-table';

export default function McpPage() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();

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

      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          <McpTable
            servers={[]}
            isAdmin={isAdmin}
            onDelete={handleDelete}
            loading
          />
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
        ) : (
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

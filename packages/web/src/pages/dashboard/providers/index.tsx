import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { ProviderProtocol, ProviderResponse } from '@agent-x/shared';
import {
  AlertTriangle,
  Database,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  PlugZap,
  Plus,
  RefreshCw,
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
import {
  useDeleteProvider,
  useProviders,
  useSyncModels,
  useTestProvider,
} from '@/hooks/use-providers';
import { cn } from '@/lib/utils';

const PROTOCOL_CONFIG: Record<
  ProviderProtocol,
  { labelKey: string; className: string }
> = {
  OPENAI: {
    labelKey: 'providers.openai',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  ANTHROPIC: {
    labelKey: 'providers.anthropic',
    className:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
  GEMINI: {
    labelKey: 'providers.gemini',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  DEEPSEEK: {
    labelKey: 'providers.deepseek',
    className:
      'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  },
  QWEN: {
    labelKey: 'providers.qwen',
    className:
      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  },
  ZHIPU: {
    labelKey: 'providers.zhipu',
    className:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  MOONSHOT: {
    labelKey: 'providers.moonshot',
    className:
      'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  },
};

function ProtocolBadge({ protocol }: { readonly protocol: ProviderProtocol }) {
  const { t } = useTranslation();
  const config = PROTOCOL_CONFIG[protocol];
  return (
    <Badge variant="outline" className={cn('border-0', config.className)}>
      {t(config.labelKey)}
    </Badge>
  );
}

function StatusDot({ active }: { readonly active: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          'inline-block size-2 rounded-full',
          active ? 'bg-green-500' : 'bg-gray-400'
        )}
      />
      <span className="text-muted-foreground text-xs">
        {active ? t('common.active') : t('common.inactive')}
      </span>
    </div>
  );
}

function truncateUrl(url: string, maxLength = 40): string {
  if (url.length <= maxLength) return url;
  return `${url.slice(0, maxLength)}...`;
}

function ProviderCard({
  provider,
  onDelete,
}: {
  readonly provider: ProviderResponse;
  readonly onDelete: (provider: ProviderResponse) => void;
}) {
  const { t } = useTranslation();
  const testProvider = useTestProvider();
  const syncModels = useSyncModels();

  function handleTest() {
    testProvider.mutate(provider.id, {
      onSuccess: result => {
        if (result.success) {
          toast.success(t('providers.testSuccess'));
        } else {
          toast.error(t('providers.testFailed'));
        }
      },
      onError: () => {
        toast.error(t('providers.testFailed'));
      },
    });
  }

  function handleSync() {
    syncModels.mutate(provider.id, {
      onSuccess: result => {
        toast.success(t('providers.syncSuccess', { count: result.synced }));
      },
      onError: () => {
        toast.error(t('providers.syncFailed'));
      },
    });
  }

  return (
    <Card className="flex flex-col hover:shadow-md hover:border-primary/20 transition-all duration-200">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base">{provider.name}</CardTitle>
          <div className="flex items-center gap-2">
            <ProtocolBadge protocol={provider.protocol} />
            <StatusDot active={provider.isActive} />
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
            <DropdownMenuItem asChild>
              <Link to={`/providers/${provider.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                {t('common.edit')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleTest}
              disabled={testProvider.isPending}
            >
              <PlugZap className="mr-2 size-4" />
              {testProvider.isPending
                ? t('providers.testing')
                : t('providers.testConnection')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSync}
              disabled={syncModels.isPending}
            >
              <RefreshCw
                className={cn(
                  'mr-2 size-4',
                  syncModels.isPending && 'animate-spin'
                )}
              />
              {syncModels.isPending
                ? t('providers.syncing')
                : t('providers.syncModels')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(provider)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <ExternalLink className="size-3.5 shrink-0" />
          <span className="truncate">{truncateUrl(provider.baseUrl)}</span>
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="text-muted-foreground text-sm">
          {t('providers.modelCount', { count: provider.models.length })}
        </div>
      </CardFooter>
    </Card>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="gradient-bg text-white flex size-16 items-center justify-center rounded-full mb-4">
        <Database className="size-8" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">
        {t('providers.noProviders')}
      </h3>
      <p className="text-muted-foreground mb-6 text-sm">
        {t('providers.noProvidersDesc')}
      </p>
      <Button
        asChild
        className="gradient-bg text-white hover:opacity-90 cursor-pointer"
      >
        <Link to="/providers/new">
          <Plus className="mr-2 size-4" />
          {t('providers.addProvider')}
        </Link>
      </Button>
    </div>
  );
}

export default function ProviderListPage() {
  const { t } = useTranslation();
  const { data: providers, isLoading, error } = useProviders();
  const deleteProvider = useDeleteProvider();
  const [deleteTarget, setDeleteTarget] = useState<ProviderResponse | null>(
    null
  );

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteProvider.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success(t('providers.deleted'));
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
          {t('common.failedToLoad', {
            resource: t('providers.title').toLowerCase(),
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
            {t('providers.title')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('providers.subtitle')}
          </p>
        </div>
        <Button
          asChild
          className="gradient-bg text-white hover:opacity-90 cursor-pointer"
        >
          <Link to="/providers/new">
            <Plus className="mr-2 size-4" />
            {t('providers.addProvider')}
          </Link>
        </Button>
      </div>

      {/* Provider grid or empty state */}
      {!providers || providers.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map(provider => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onDelete={setDeleteTarget}
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
            <AlertDialogTitle>{t('providers.deleteProvider')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('providers.deleteConfirm', { name: deleteTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteProvider.isPending}
            >
              {deleteProvider.isPending
                ? t('common.deleting')
                : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

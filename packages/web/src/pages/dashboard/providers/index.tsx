import { useState } from 'react';
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
import {
  useDeleteProvider,
  useProviders,
  useSyncModels,
  useTestProvider,
} from '@/hooks/use-providers';
import { cn } from '@/lib/utils';

const PROTOCOL_CONFIG: Record<
  ProviderProtocol,
  { label: string; className: string }
> = {
  OPENAI: {
    label: 'OpenAI',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  ANTHROPIC: {
    label: 'Anthropic',
    className:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
  GEMINI: {
    label: 'Gemini',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  DEEPSEEK: {
    label: 'DeepSeek',
    className:
      'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  },
  QWEN: {
    label: 'Qwen',
    className:
      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  },
  ZHIPU: {
    label: 'GLM',
    className:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  MOONSHOT: {
    label: 'Kimi',
    className:
      'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  },
};

function ProtocolBadge({ protocol }: { readonly protocol: ProviderProtocol }) {
  const config = PROTOCOL_CONFIG[protocol];
  return (
    <Badge variant="outline" className={cn('border-0', config.className)}>
      {config.label}
    </Badge>
  );
}

function StatusDot({ active }: { readonly active: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          'inline-block size-2 rounded-full',
          active ? 'bg-green-500' : 'bg-gray-400'
        )}
      />
      <span className="text-muted-foreground text-xs">
        {active ? 'Active' : 'Inactive'}
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
  onTestResult,
}: {
  readonly provider: ProviderResponse;
  readonly onDelete: (provider: ProviderResponse) => void;
  readonly onTestResult: (message: string, success: boolean) => void;
}) {
  const testProvider = useTestProvider();
  const syncModels = useSyncModels();

  function handleTest() {
    testProvider.mutate(provider.id, {
      onSuccess: result => {
        onTestResult(result.message, result.success);
      },
      onError: () => {
        onTestResult(
          'Connection test failed. Check your configuration.',
          false
        );
      },
    });
  }

  function handleSync() {
    syncModels.mutate(provider.id, {
      onSuccess: models => {
        onTestResult(`Synced ${models.length} model(s) successfully.`, true);
      },
      onError: () => {
        onTestResult('Failed to sync models.', false);
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
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/providers/${provider.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleTest}
              disabled={testProvider.isPending}
            >
              <PlugZap className="mr-2 size-4" />
              {testProvider.isPending ? 'Testing...' : 'Test Connection'}
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
              {syncModels.isPending ? 'Syncing...' : 'Sync Models'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(provider)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
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
          {provider.models.length} model
          {provider.models.length !== 1 ? 's' : ''}
        </div>
      </CardFooter>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="gradient-bg text-white flex size-16 items-center justify-center rounded-full mb-4">
        <Database className="size-8" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">No providers yet</h3>
      <p className="text-muted-foreground mb-6 text-sm">
        Add your first AI provider to get started.
      </p>
      <Button
        asChild
        className="gradient-bg text-white hover:opacity-90 cursor-pointer"
      >
        <Link to="/providers/new">
          <Plus className="mr-2 size-4" />
          Add Provider
        </Link>
      </Button>
    </div>
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
        Dismiss
      </Button>
    </div>
  );
}

export default function ProviderListPage() {
  const { data: providers, isLoading, error } = useProviders();
  const deleteProvider = useDeleteProvider();
  const [deleteTarget, setDeleteTarget] = useState<ProviderResponse | null>(
    null
  );
  const [testResult, setTestResult] = useState<{
    message: string;
    success: boolean;
  } | null>(null);

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteProvider.mutate(deleteTarget.id, {
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
          Loading providers...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">Failed to load providers</h3>
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
          <h1 className="text-2xl font-bold tracking-tight">Providers</h1>
          <p className="text-muted-foreground text-sm">
            Manage your AI provider connections.
          </p>
        </div>
        <Button
          asChild
          className="gradient-bg text-white hover:opacity-90 cursor-pointer"
        >
          <Link to="/providers/new">
            <Plus className="mr-2 size-4" />
            Add Provider
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
              onTestResult={handleTestResult}
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
            <DialogTitle>Delete Provider</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}
              &rdquo;? This action cannot be undone and will remove all
              associated models.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteProvider.isPending}
            >
              {deleteProvider.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from 'react';

import {
  AlertTriangle,
  Check,
  ClipboardCopy,
  Key,
  Plus,
  Trash2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAgents } from '@/hooks/use-agents';
import type { ApiKeyResponse } from '@/hooks/use-api-keys';
import {
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
} from '@/hooks/use-api-keys';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StatusBadge({
  isActive,
  expiresAt,
}: {
  readonly isActive: boolean;
  readonly expiresAt: string | null;
}) {
  if (!isActive) {
    return (
      <Badge
        variant="outline"
        className="border-0 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      >
        Revoked
      </Badge>
    );
  }

  if (expiresAt && new Date(expiresAt) < new Date()) {
    return (
      <Badge
        variant="outline"
        className="border-0 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      >
        Expired
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    >
      Active
    </Badge>
  );
}

function CreateKeyDialog({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [agentId, setAgentId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createApiKey = useCreateApiKey();
  const { data: agents } = useAgents();

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setName('');
      setAgentId('');
      setExpiresAt('');
      setCreatedKey(null);
      setCopied(false);
    }
    onOpenChange(nextOpen);
  }

  function handleCreate() {
    createApiKey.mutate(
      {
        name,
        agentId: agentId || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      },
      {
        onSuccess: data => {
          setCreatedKey(data.plainKey);
        },
      }
    );
  }

  async function handleCopy() {
    if (!createdKey) return;
    try {
      await navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in non-HTTPS contexts
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {createdKey ? 'API Key Created' : 'Create API Key'}
          </DialogTitle>
          <DialogDescription>
            {createdKey
              ? 'Copy your API key now. It will not be shown again.'
              : 'Create a new API key for programmatic access.'}
          </DialogDescription>
        </DialogHeader>

        {createdKey ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
              <p className="mb-2 text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Make sure to copy your API key now. You will not be able to see
                it again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all rounded bg-yellow-100 px-2 py-1 font-mono text-xs dark:bg-yellow-900">
                  {createdKey}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="size-4 text-green-600" />
                  ) : (
                    <ClipboardCopy className="size-4" />
                  )}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Done</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="key-name">Name</Label>
              <Input
                id="key-name"
                placeholder="e.g. Production API Key"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="key-agent">Agent (optional)</Label>
              <select
                id="key-agent"
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={agentId}
                onChange={e => setAgentId(e.target.value)}
              >
                <option value="">Any agent (specify in request)</option>
                {agents?.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              <p className="text-muted-foreground text-xs">
                Bind this key to a specific agent, or leave blank to specify the
                agent in each request via the model field.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="key-expires">Expiration (optional)</Label>
              <Input
                id="key-expires"
                type="date"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || createApiKey.isPending}
              >
                {createApiKey.isPending ? 'Creating...' : 'Create Key'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmDialog({
  target,
  onOpenChange,
}: {
  readonly target: ApiKeyResponse | null;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const deleteApiKey = useDeleteApiKey();

  function handleDelete() {
    if (!target) return;
    deleteApiKey.mutate(target.id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  }

  return (
    <Dialog
      open={target !== null}
      onOpenChange={open => {
        if (!open) onOpenChange(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke API Key</DialogTitle>
          <DialogDescription>
            Are you sure you want to revoke &ldquo;{target?.name}&rdquo;? Any
            applications using this key will no longer be able to authenticate.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteApiKey.isPending}
          >
            {deleteApiKey.isPending ? 'Revoking...' : 'Revoke Key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ onCreateClick }: { readonly onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <Key className="text-muted-foreground mb-4 size-12" />
      <h3 className="mb-1 text-lg font-semibold">No API keys yet</h3>
      <p className="text-muted-foreground mb-6 text-sm">
        Create your first API key to use the OpenAI-compatible API.
      </p>
      <Button onClick={onCreateClick}>
        <Plus className="mr-2 size-4" />
        Create API Key
      </Button>
    </div>
  );
}

function UsageDocs() {
  const [copied, setCopied] = useState(false);

  const curlExample = `curl https://your-domain/v1/chat/completions \\
  -H "Authorization: Bearer sk-agx-..." \\
  -H "Content-Type: application/json" \\
  -d '{"model":"<agent-id>","messages":[{"role":"user","content":"Hello"}]}'`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(curlExample);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in non-HTTPS contexts
    }
  }

  return (
    <div className="rounded-lg border p-6">
      <h3 className="mb-2 text-lg font-semibold">Usage</h3>
      <p className="text-muted-foreground mb-4 text-sm">
        Use your API key with any OpenAI-compatible client. The endpoint follows
        the OpenAI Chat Completions API format.
      </p>
      <div className="relative">
        <pre className="bg-muted overflow-x-auto rounded-md p-4 font-mono text-sm">
          {curlExample}
        </pre>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 size-8"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="size-4 text-green-600" />
          ) : (
            <ClipboardCopy className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default function ApiKeysPage() {
  const { data: apiKeys, isLoading, error } = useApiKeys();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyResponse | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground text-sm">Loading API keys...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">Failed to load API keys</h3>
        <p className="text-muted-foreground text-sm">
          Please try refreshing the page.
        </p>
      </div>
    );
  }

  const hasKeys = apiKeys && apiKeys.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
          <p className="text-muted-foreground text-sm">
            Manage API keys for the OpenAI-compatible endpoint.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          Create Key
        </Button>
      </div>

      {/* Table or Empty State */}
      {hasKeys ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map(apiKey => (
                <TableRow key={apiKey.id}>
                  <TableCell className="font-medium">{apiKey.name}</TableCell>
                  <TableCell>
                    <code className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">
                      {apiKey.key}
                    </code>
                  </TableCell>
                  <TableCell>
                    {apiKey.agent ? (
                      <span>{apiKey.agent.name}</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Any</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(apiKey.lastUsedAt)}</TableCell>
                  <TableCell>{formatDate(apiKey.expiresAt)}</TableCell>
                  <TableCell>
                    <StatusBadge
                      isActive={apiKey.isActive}
                      expiresAt={apiKey.expiresAt}
                    />
                  </TableCell>
                  <TableCell>
                    {apiKey.isActive && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(apiKey)}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Revoke</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState onCreateClick={() => setCreateOpen(true)} />
      )}

      {/* Usage docs */}
      <UsageDocs />

      {/* Create key dialog */}
      <CreateKeyDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        target={deleteTarget}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
}

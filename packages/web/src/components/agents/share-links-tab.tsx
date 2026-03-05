import { useState } from 'react';

import { formatDistanceToNow } from 'date-fns';
import { Ban, Check, Copy, Link2, Loader2 } from 'lucide-react';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAgentVersions } from '@/hooks/use-agent-versions';
import {
  useCreateShareToken,
  useDeactivateShareToken,
  useShareTokens,
} from '@/hooks/use-share-tokens';

interface ShareLinksTabProps {
  agentId: string;
}

export function ShareLinksTab({ agentId }: ShareLinksTabProps) {
  const { data: versions, isLoading: isLoadingVersions } =
    useAgentVersions(agentId);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');

  // Use the first version as default when versions load
  const effectiveVersionId =
    selectedVersionId || (versions?.length ? versions[0].id : '');

  const { data: tokens, isLoading: isLoadingTokens } = useShareTokens(
    agentId,
    effectiveVersionId || undefined
  );
  const createToken = useCreateShareToken();
  const deactivateToken = useDeactivateShareToken();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [expiresIn, setExpiresIn] = useState('');
  const [maxConversations, setMaxConversations] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  async function handleCreate() {
    if (!effectiveVersionId) return;

    const dto: {
      name: string;
      expiresAt?: string;
      maxConversations?: number;
    } = {
      name: tokenName.trim(),
    };
    if (expiresIn) {
      const hours = parseInt(expiresIn, 10);
      if (!isNaN(hours) && hours > 0) {
        dto.expiresAt = new Date(Date.now() + hours * 3600000).toISOString();
      }
    }
    if (maxConversations) {
      const max = parseInt(maxConversations, 10);
      if (!isNaN(max) && max > 0) {
        dto.maxConversations = max;
      }
    }

    try {
      const result = await createToken.mutateAsync({
        agentId,
        versionId: effectiveVersionId,
        dto,
      });
      setCreatedToken(result.plainToken);
      toast.success('Share link created');
    } catch {
      // mutation error handled by React Query
    }
  }

  function getShareUrl(token: string) {
    return `${window.location.origin}/s/${token}`;
  }

  async function handleCopy(text: string, tokenId?: string) {
    try {
      await navigator.clipboard.writeText(text);
      if (tokenId) {
        setCopiedTokenId(tokenId);
        setTimeout(() => setCopiedTokenId(null), 2000);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Clipboard API may fail in non-HTTPS contexts
    }
  }

  function handleCloseDialog() {
    setDialogOpen(false);
    setTokenName('');
    setExpiresIn('');
    setMaxConversations('');
    setCreatedToken(null);
    setCopied(false);
  }

  const selectedVersion = versions?.find(v => v.id === effectiveVersionId);

  if (isLoadingVersions) {
    return (
      <Card className="max-w-4xl">
        <CardContent className="py-8">
          <div className="text-muted-foreground text-center text-sm">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!versions?.length) {
    return (
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Share Links</CardTitle>
          <CardDescription>
            Manage share links for your published versions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              No versions published yet.
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Publish a version first to create share links.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Share Links</CardTitle>
            <CardDescription>
              Manage share links for your published versions.
            </CardDescription>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={open => {
              if (!open) handleCloseDialog();
              else setDialogOpen(true);
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Link2 className="mr-2 size-3.5" />
                Create Share Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              {createdToken ? (
                <>
                  <DialogHeader>
                    <DialogTitle>Share Link Created</DialogTitle>
                    <DialogDescription>
                      Copy this link to share with others.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex items-center gap-2">
                    <Input
                      value={getShareUrl(createdToken)}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleCopy(getShareUrl(createdToken))}
                    >
                      {copied ? (
                        <Check className="size-4" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCloseDialog}>Done</Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Create Share Link</DialogTitle>
                    <DialogDescription>
                      Generate a shareable link for version v
                      {selectedVersion?.version}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="sl-token-name">Name</Label>
                      <Input
                        id="sl-token-name"
                        placeholder="e.g., Demo link"
                        value={tokenName}
                        onChange={e => setTokenName(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="sl-expires-in">
                        Expires in (hours, optional)
                      </Label>
                      <Input
                        id="sl-expires-in"
                        type="number"
                        placeholder="e.g., 24"
                        value={expiresIn}
                        onChange={e => setExpiresIn(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="sl-max-conv">
                        Max conversations (optional)
                      </Label>
                      <Input
                        id="sl-max-conv"
                        type="number"
                        placeholder="e.g., 100"
                        value={maxConversations}
                        onChange={e => setMaxConversations(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleCloseDialog}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={!tokenName.trim() || createToken.isPending}
                    >
                      {createToken.isPending && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      Create
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Version filter */}
        <div className="flex items-center gap-3">
          <Label className="text-sm whitespace-nowrap">Version</Label>
          <select
            value={effectiveVersionId}
            onChange={e => setSelectedVersionId(e.target.value)}
            className="border-input bg-background ring-offset-background focus:ring-ring flex h-9 w-48 rounded-md border px-3 py-1 text-sm shadow-sm focus:ring-1 focus:outline-none"
          >
            {versions.map(v => (
              <option key={v.id} value={v.id}>
                v{v.version}
                {v.changelog ? ` — ${v.changelog}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Token list */}
        {isLoadingTokens ? (
          <div className="text-muted-foreground py-4 text-center text-sm">
            Loading share links...
          </div>
        ) : !tokens?.length ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            No share links for this version.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {tokens.map(token => (
              <div
                key={token.id}
                className="flex items-center justify-between rounded-md border px-3 py-3"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium">{token.name}</span>
                    <Badge variant={token.isActive ? 'default' : 'secondary'}>
                      {token.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {token.usedConversations}
                      {token.maxConversations !== null
                        ? `/${token.maxConversations}`
                        : ''}{' '}
                      conversations
                    </span>
                    {token.expiresAt && (
                      <span className="text-muted-foreground text-xs">
                        expires{' '}
                        {formatDistanceToNow(new Date(token.expiresAt), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                    <span className="text-muted-foreground text-xs">
                      created{' '}
                      {formatDistanceToNow(new Date(token.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  {token.tokenSlug && (
                    <div className="flex items-center gap-1.5">
                      <code className="text-muted-foreground truncate text-xs">
                        {getShareUrl(token.tokenSlug)}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6 cursor-pointer"
                        onClick={() =>
                          handleCopy(getShareUrl(token.tokenSlug), token.id)
                        }
                      >
                        {copiedTokenId === token.id ? (
                          <Check className="size-3" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
                {token.isActive && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <Ban className="size-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Deactivate Share Link
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently disable this share link. Anyone
                          with this link will no longer be able to start new
                          conversations. Existing conversations will not be
                          affected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() =>
                            deactivateToken.mutate(
                              {
                                agentId,
                                versionId: effectiveVersionId,
                                tokenId: token.id,
                              },
                              {
                                onSuccess: () => {
                                  toast.success('Share link deactivated');
                                },
                              }
                            )
                          }
                        >
                          Deactivate
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

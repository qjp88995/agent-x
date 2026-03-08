import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAgentVersions } from '@/hooks/use-agent-versions';
import { useDateLocale } from '@/hooks/use-date-locale';
import {
  useCreateShareToken,
  useDeactivateShareToken,
  useShareTokens,
} from '@/hooks/use-share-tokens';

interface ShareLinksTabProps {
  agentId: string;
}

export function ShareLinksTab({ agentId }: ShareLinksTabProps) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
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
      toast.success(t('shareLinks.linkCreatedToast'));
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
            {t('common.loading')}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!versions?.length) {
    return (
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>{t('shareLinks.title')}</CardTitle>
          <CardDescription>{t('shareLinks.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              {t('shareLinks.noVersions')}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {t('shareLinks.noVersionsDesc')}
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
            <CardTitle>{t('shareLinks.title')}</CardTitle>
            <CardDescription>{t('shareLinks.subtitle')}</CardDescription>
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
                {t('shareLinks.createLink')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              {createdToken ? (
                <>
                  <DialogHeader>
                    <DialogTitle>{t('shareLinks.linkCreated')}</DialogTitle>
                    <DialogDescription>
                      {t('shareLinks.linkCreatedDesc')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex items-center gap-2">
                    <Input
                      value={getShareUrl(createdToken)}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
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
                      </TooltipTrigger>
                      <TooltipContent>{t('common.copy')}</TooltipContent>
                    </Tooltip>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleCloseDialog}>
                      {t('common.done')}
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>{t('shareLinks.createLink')}</DialogTitle>
                    <DialogDescription>
                      {t('shareLinks.createDesc', {
                        version: selectedVersion?.version,
                      })}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="sl-token-name">{t('common.name')}</Label>
                      <Input
                        id="sl-token-name"
                        placeholder={t('shareLinks.namePlaceholder')}
                        value={tokenName}
                        onChange={e => setTokenName(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="sl-expires-in">
                        {t('shareLinks.expiresIn')}
                      </Label>
                      <Input
                        id="sl-expires-in"
                        type="number"
                        placeholder={t('shareLinks.expiresPlaceholder')}
                        value={expiresIn}
                        onChange={e => setExpiresIn(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="sl-max-conv">
                        {t('shareLinks.maxConversations')}
                      </Label>
                      <Input
                        id="sl-max-conv"
                        type="number"
                        placeholder={t(
                          'shareLinks.maxConversationsPlaceholder'
                        )}
                        value={maxConversations}
                        onChange={e => setMaxConversations(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={handleCloseDialog}>
                      {t('common.cancel')}
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={!tokenName.trim() || createToken.isPending}
                      className="gradient-bg cursor-pointer text-white hover:opacity-90"
                    >
                      {createToken.isPending && (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      )}
                      {t('common.create')}
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
          <Label className="text-sm whitespace-nowrap">
            {t('shareLinks.version')}
          </Label>
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
            {t('shareLinks.loading')}
          </div>
        ) : !tokens?.length ? (
          <p className="text-muted-foreground py-4 text-center text-sm">
            {t('shareLinks.noLinks')}
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
                      {token.isActive
                        ? t('common.active')
                        : t('common.inactive')}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {token.usedConversations}
                      {token.maxConversations !== null
                        ? `/${token.maxConversations}`
                        : ''}{' '}
                      {t('shareLinks.conversations')}
                    </span>
                    {token.expiresAt && (
                      <span className="text-muted-foreground text-xs">
                        {t('shareLinks.expires')}{' '}
                        {formatDistanceToNow(new Date(token.expiresAt), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </span>
                    )}
                    <span className="text-muted-foreground text-xs">
                      {t('shareLinks.created')}{' '}
                      {formatDistanceToNow(new Date(token.createdAt), {
                        addSuffix: true,
                        locale: dateLocale,
                      })}
                    </span>
                  </div>
                  {token.tokenSlug && (
                    <div className="flex items-center gap-1.5">
                      <code className="text-muted-foreground truncate text-xs">
                        {getShareUrl(token.tokenSlug)}
                      </code>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-6 cursor-pointer"
                            onClick={() =>
                              handleCopy(
                                getShareUrl(token.tokenSlug!),
                                token.id
                              )
                            }
                          >
                            {copiedTokenId === token.id ? (
                              <Check className="size-3" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t('common.copy')}</TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
                {token.isActive && (
                  <AlertDialog>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Ban className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t('shareLinks.deactivate')}
                      </TooltipContent>
                    </Tooltip>
                    <AlertDialogContent variant="destructive">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t('shareLinks.deactivate')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('shareLinks.deactivateDesc')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t('common.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            deactivateToken.mutate(
                              {
                                agentId,
                                versionId: effectiveVersionId,
                                tokenId: token.id,
                              },
                              {
                                onSuccess: () => {
                                  toast.success(
                                    t('shareLinks.linkDeactivated')
                                  );
                                },
                              }
                            )
                          }
                        >
                          {t('shareLinks.deactivate')}
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

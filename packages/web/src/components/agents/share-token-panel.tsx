import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
} from '@agent-x/design';
import { formatDistanceToNow } from 'date-fns';
import { Check, Copy, Link2, Loader2, XCircle } from 'lucide-react';

import { useDateLocale } from '@/hooks/use-date-locale';
import {
  useCreateShareToken,
  useDeactivateShareToken,
  useShareTokens,
} from '@/hooks/use-share-tokens';

interface ShareTokenPanelProps {
  agentId: string;
  versionId: string;
}

export function ShareTokenPanel({ agentId, versionId }: ShareTokenPanelProps) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const { data: tokens, isLoading } = useShareTokens(agentId, versionId);
  const createToken = useCreateShareToken();
  const deactivateToken = useDeactivateShareToken();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [tokenName, setTokenName] = useState('');
  const [expiresIn, setExpiresIn] = useState('');
  const [maxConversations, setMaxConversations] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
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
        versionId,
        dto,
      });
      setCreatedToken(result.plainToken);
    } catch {
      // mutation error handled by React Query
    }
  }

  function getShareUrl(token: string) {
    return `${window.location.origin}/s/${token}`;
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  if (isLoading) {
    return (
      <div className="text-foreground-muted py-4 text-center text-sm">
        {t('shareLinks.loading')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{t('shareLinks.title')}</h4>
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
                    {t('shareLinks.createDesc', { version: '' })}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="token-name">{t('common.name')}</Label>
                    <Input
                      id="token-name"
                      placeholder={t('shareLinks.namePlaceholder')}
                      value={tokenName}
                      onChange={e => setTokenName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="expires-in">
                      {t('shareLinks.expiresIn')}
                    </Label>
                    <Input
                      id="expires-in"
                      type="number"
                      placeholder={t('shareLinks.expiresPlaceholder')}
                      value={expiresIn}
                      onChange={e => setExpiresIn(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="max-conv">
                      {t('shareLinks.maxConversations')}
                    </Label>
                    <Input
                      id="max-conv"
                      type="number"
                      placeholder={t('shareLinks.maxConversationsPlaceholder')}
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
                    variant="primary"
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

      {!tokens?.length ? (
        <p className="text-foreground-muted text-sm">
          {t('shareLinks.noLinks')}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {tokens.map(token => (
            <div
              key={token.id}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{token.name}</span>
                <Badge variant={token.isActive ? 'default' : 'muted'}>
                  {token.isActive ? t('common.active') : t('common.inactive')}
                </Badge>
                <span className="text-foreground-muted text-xs">
                  {token.usedConversations}
                  {token.maxConversations !== null
                    ? `/${token.maxConversations}`
                    : ''}{' '}
                  {t('shareLinks.conversations')}
                </span>
                {token.expiresAt && (
                  <span className="text-foreground-muted text-xs">
                    {t('shareLinks.expires')}{' '}
                    {formatDistanceToNow(new Date(token.expiresAt), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </span>
                )}
              </div>
              {token.isActive && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    deactivateToken.mutate({
                      agentId,
                      versionId,
                      tokenId: token.id,
                    })
                  }
                >
                  <XCircle className="size-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

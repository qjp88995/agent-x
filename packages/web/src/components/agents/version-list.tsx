import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import {
  Badge,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  CopyableText,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@agent-x/design';
import type { AgentVersionResponse } from '@agent-x/shared';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronRight, Link2, MessageSquare } from 'lucide-react';

import { VersionShareLinks } from '@/components/agents/version-share-links';
import { useAgentVersions } from '@/hooks/use-agent-versions';
import { useDateLocale } from '@/hooks/use-date-locale';
import { cn } from '@/lib/utils';

interface VersionListProps {
  agentId: string;
}

function VersionDetail({ version }: { version: AgentVersionResponse }) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Version ID */}
      <div className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-foreground-muted text-xs font-medium uppercase tracking-wider">
          {t('versions.versionId')}
        </span>
        <div className="-mx-1.5 w-fit">
          <CopyableText
            text={version.id}
            truncate={8}
            copyLabel={t('common.copy')}
            copiedLabel={t('common.copied')}
          />
        </div>
      </div>

      {/* Model */}
      <div className="flex flex-col gap-1">
        <span className="text-foreground-muted text-xs font-medium uppercase tracking-wider">
          {t('versions.model')}
        </span>
        <span className="text-sm">
          {version.provider?.name ?? version.providerId} / {version.modelId}
        </span>
      </div>

      {/* Parameters */}
      <div className="flex flex-col gap-1">
        <span className="text-foreground-muted text-xs font-medium uppercase tracking-wider">
          {t('versions.parameters')}
        </span>
        <span className="text-sm">
          {t('agents.temperature')} {version.temperature} ·{' '}
          {t('agents.maxTokens')} {version.maxTokens.toLocaleString()}
        </span>
      </div>

      {/* System Prompt */}
      <div className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-foreground-muted text-xs font-medium uppercase tracking-wider">
          {t('versions.systemPrompt')}
        </span>
        <pre className="bg-surface/50 max-h-40 overflow-y-auto rounded-md p-3 text-xs leading-relaxed whitespace-pre-wrap">
          {version.systemPrompt}
        </pre>
      </div>

      {/* Skills */}
      {version.skillsSnapshot.length > 0 && (
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-foreground-muted text-xs font-medium uppercase tracking-wider">
            {t('versions.skills')} ({version.skillsSnapshot.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {version.skillsSnapshot.map(skill => (
              <Badge key={skill.skillId} variant="muted" className="text-xs">
                {skill.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* MCP Servers */}
      {version.mcpServersSnapshot.length > 0 && (
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-foreground-muted text-xs font-medium uppercase tracking-wider">
            {t('versions.mcpServers')} ({version.mcpServersSnapshot.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {version.mcpServersSnapshot.map(server => (
              <Badge
                key={server.mcpServerId}
                variant="muted"
                className="text-xs"
              >
                {server.name}
                <span className="text-foreground-muted ml-1">
                  ({server.transport})
                </span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function VersionItem({
  agentId,
  version,
  isExpanded,
  onToggle,
}: {
  agentId: string;
  version: AgentVersionResponse;
  isExpanded: boolean;
  onToggle: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const conversationCount = version._count?.conversations ?? 0;

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={onToggle}
      className="overflow-hidden rounded-lg border"
    >
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between gap-2 p-4 text-left transition-colors',
          'hover:bg-surface/30 cursor-pointer',
          isExpanded && 'bg-surface/20'
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          {isExpanded ? (
            <ChevronDown className="text-foreground-muted size-4 shrink-0" />
          ) : (
            <ChevronRight className="text-foreground-muted size-4 shrink-0" />
          )}
          <Badge variant="outline" className="shrink-0">
            v{version.version}
          </Badge>

          <span className="text-foreground-muted shrink-0 text-sm">
            {formatDistanceToNow(new Date(version.publishedAt), {
              addSuffix: true,
              locale: dateLocale,
            })}
          </span>
          {version.changelog && (
            <span className="text-foreground-muted min-w-0 truncate text-sm sm:max-w-60">
              {version.changelog}
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-foreground-muted hidden items-center gap-1 text-sm sm:flex">
            <Link2 className="size-3.5" />
            {version._count?.shareTokens ?? 0}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-foreground-muted h-7 gap-1 px-2"
                asChild
                onClick={e => e.stopPropagation()}
              >
                <Link
                  to={`/agents/${agentId}/versions/${version.id}/conversations`}
                >
                  <MessageSquare className="size-3.5" />
                  {conversationCount}
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('conversations.title')}</TooltipContent>
          </Tooltip>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-6 border-t px-4 pb-4 pt-4">
          {/* Configuration snapshot */}
          <VersionDetail version={version} />

          {/* Share links */}
          <div className="border-t pt-4">
            <h4 className="mb-3 text-sm font-medium">
              {t('agents.shareLinks')}
            </h4>
            <VersionShareLinks
              agentId={agentId}
              versionId={version.id}
              versionNumber={version.version}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function VersionList({ agentId }: VersionListProps) {
  const { t } = useTranslation();
  const { data: versions, isLoading } = useAgentVersions(agentId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="text-foreground-muted py-8 text-center text-sm">
        {t('versions.loading')}
      </div>
    );
  }

  if (!versions?.length) {
    return (
      <div className="py-8 text-center">
        <p className="text-foreground-muted text-sm">
          {t('versions.noVersions')}
        </p>
        <p className="text-foreground-muted mt-1 text-xs">
          {t('versions.noVersionsDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {versions.map(version => (
        <VersionItem
          key={version.id}
          agentId={agentId}
          version={version}
          isExpanded={expandedId === version.id}
          onToggle={open => setExpandedId(open ? version.id : null)}
        />
      ))}
    </div>
  );
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { AgentVersionResponse } from '@agent-x/shared';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronRight, MessageSquare, Share2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { useAgentVersions } from '@/hooks/use-agent-versions';
import { useDateLocale } from '@/hooks/use-date-locale';
import { cn } from '@/lib/utils';

interface VersionListProps {
  agentId: string;
}

function VersionDetail({ version }: { version: AgentVersionResponse }) {
  const { t } = useTranslation();
  return (
    <div className="border-t px-4 pb-4 pt-3">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Model */}
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            {t('versions.model')}
          </span>
          <span className="text-sm">
            {version.provider?.name ?? version.providerId} / {version.modelId}
          </span>
        </div>

        {/* Parameters */}
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            {t('versions.parameters')}
          </span>
          <span className="text-sm">
            {t('agents.temperature')} {version.temperature} ·{' '}
            {t('agents.maxTokens')} {version.maxTokens.toLocaleString()}
          </span>
        </div>
      </div>

      {/* System Prompt */}
      <div className="mt-4 flex flex-col gap-1">
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          {t('versions.systemPrompt')}
        </span>
        <pre className="bg-muted/50 max-h-40 overflow-y-auto rounded-md p-3 text-xs leading-relaxed whitespace-pre-wrap">
          {version.systemPrompt}
        </pre>
      </div>

      {/* Skills */}
      {version.skillsSnapshot.length > 0 && (
        <div className="mt-4 flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            {t('versions.skills')} ({version.skillsSnapshot.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {version.skillsSnapshot.map(skill => (
              <Badge
                key={skill.skillId}
                variant="secondary"
                className="text-xs"
              >
                {skill.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* MCP Servers */}
      {version.mcpServersSnapshot.length > 0 && (
        <div className="mt-4 flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            {t('versions.mcpServers')} ({version.mcpServersSnapshot.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {version.mcpServersSnapshot.map(server => (
              <Badge
                key={server.mcpServerId}
                variant="secondary"
                className="text-xs"
              >
                {server.name}
                <span className="text-muted-foreground ml-1">
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

export function VersionList({ agentId }: VersionListProps) {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const { data: versions, isLoading } = useAgentVersions(agentId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        {t('versions.loading')}
      </div>
    );
  }

  if (!versions?.length) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground text-sm">
          {t('versions.noVersions')}
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          {t('versions.noVersionsDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {versions.map(version => {
        const isExpanded = expandedId === version.id;

        return (
          <div key={version.id} className="overflow-hidden rounded-lg border">
            <button
              type="button"
              className={cn(
                'flex w-full items-center justify-between p-4 text-left transition-colors',
                'hover:bg-muted/30 cursor-pointer',
                isExpanded && 'bg-muted/20'
              )}
              onClick={() => setExpandedId(isExpanded ? null : version.id)}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="text-muted-foreground size-4 shrink-0" />
                ) : (
                  <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                )}
                <Badge variant="outline">v{version.version}</Badge>
                <span className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(version.publishedAt), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </span>
                {version.changelog && (
                  <span className="max-w-[300px] truncate text-sm">
                    {version.changelog}
                  </span>
                )}
              </div>
              <div className="text-muted-foreground flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <Share2 className="size-3.5" />
                  {version._count?.shareTokens ?? 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="size-3.5" />
                  {version._count?.conversations ?? 0}
                </span>
              </div>
            </button>

            {isExpanded && <VersionDetail version={version} />}
          </div>
        );
      })}
    </div>
  );
}

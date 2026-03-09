import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { AgentVersionResponse } from '@agent-x/shared';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronRight, Link2, MessageSquare } from 'lucide-react';

import { VersionConversations } from '@/components/agents/version-conversations';
import { VersionShareLinks } from '@/components/agents/version-share-links';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

      {/* System Prompt */}
      <div className="flex flex-col gap-1 sm:col-span-2">
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          {t('versions.systemPrompt')}
        </span>
        <pre className="bg-muted/50 max-h-40 overflow-y-auto rounded-md p-3 text-xs leading-relaxed whitespace-pre-wrap">
          {version.systemPrompt}
        </pre>
      </div>

      {/* Skills */}
      {version.skillsSnapshot.length > 0 && (
        <div className="flex flex-col gap-1.5 sm:col-span-2">
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
        <div className="flex flex-col gap-1.5 sm:col-span-2">
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

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={onToggle}
      className="overflow-hidden rounded-lg border"
    >
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between p-4 text-left transition-colors',
          'hover:bg-muted/30 cursor-pointer',
          isExpanded && 'bg-muted/20'
        )}
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
            <span className="max-w-75 truncate text-sm">
              {version.changelog}
            </span>
          )}
        </div>
        <div className="text-muted-foreground flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <Link2 className="size-3.5" />
            {version._count?.shareTokens ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3.5" />
            {version._count?.conversations ?? 0}
          </span>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t px-4 pb-4 pt-3">
          <Tabs defaultValue="detail">
            <TabsList>
              <TabsTrigger value="detail">
                {t('versions.configSnapshot')}
              </TabsTrigger>
              <TabsTrigger value="share-links">
                {t('agents.shareLinks')}
              </TabsTrigger>
              <TabsTrigger value="conversations">
                {t('agents.conversations')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="detail">
              <VersionDetail version={version} />
            </TabsContent>

            <TabsContent value="share-links">
              <VersionShareLinks
                agentId={agentId}
                versionId={version.id}
                versionNumber={version.version}
              />
            </TabsContent>

            <TabsContent value="conversations">
              <VersionConversations agentId={agentId} versionId={version.id} />
            </TabsContent>
          </Tabs>
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

import { useState } from 'react';

import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronRight, MessageSquare, Share2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { useAgentVersions } from '@/hooks/use-agent-versions';

import { ShareTokenPanel } from './share-token-panel';

interface VersionListProps {
  agentId: string;
}

export function VersionList({ agentId }: VersionListProps) {
  const { data: versions, isLoading } = useAgentVersions(agentId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        Loading versions...
      </div>
    );
  }

  if (!versions?.length) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground text-sm">
          No versions published yet.
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          Publish a version to create shareable links.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {versions.map(version => {
        const isExpanded = expandedId === version.id;
        return (
          <div key={version.id} className="rounded-lg border">
            <button
              type="button"
              className="hover:bg-muted/50 flex w-full items-center justify-between p-4 transition-colors"
              onClick={() => setExpandedId(isExpanded ? null : version.id)}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronRight className="size-4" />
                )}
                <Badge variant="outline">v{version.version}</Badge>
                <span className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(version.publishedAt), {
                    addSuffix: true,
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
            {isExpanded && (
              <div className="border-t p-4">
                <ShareTokenPanel agentId={agentId} versionId={version.id} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

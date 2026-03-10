import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { AgentResponse } from '@agent-x/shared';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useAddAgentMcp,
  useRemoveAgentMcp,
  useUpdateAgentMcp,
} from '@/hooks/use-agents';
import { useMcpMarket, useMcpServers } from '@/hooks/use-mcp';

type BoundMcpServer = AgentResponse['mcpServers'][number];

interface AgentMcpTabProps {
  agentId: string;
  currentMcpServers: AgentResponse['mcpServers'];
}

export function AgentMcpTab({ agentId, currentMcpServers }: AgentMcpTabProps) {
  const { t } = useTranslation();
  const { data: customServers } = useMcpServers();
  const { data: marketServers } = useMcpMarket();
  const addMcp = useAddAgentMcp();
  const removeMcp = useRemoveAgentMcp();

  const boundIds = useMemo(
    () => new Set(currentMcpServers.map(s => s.mcpServerId)),
    [currentMcpServers]
  );

  const allAvailable = [...(customServers ?? []), ...(marketServers ?? [])];
  const availableServers = allAvailable.filter(
    (s, i, arr) =>
      !boundIds.has(s.id) && arr.findIndex(x => x.id === s.id) === i
  );

  function handleAdd(mcpServerId: string) {
    addMcp.mutate(
      { agentId, mcpServerId },
      {
        onSuccess: () => {
          toast.success(t('mcp.created'));
        },
      }
    );
  }

  function handleRemove(mcpServerId: string) {
    removeMcp.mutate(
      { agentId, mcpServerId },
      {
        onSuccess: () => {
          toast.success(t('mcp.deleted'));
        },
      }
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto flex flex-col gap-6 max-w-4xl">
      {/* Bound MCP servers */}
      <Card>
        <CardHeader>
          <CardTitle>{t('agentMcp.boundServers')}</CardTitle>
          <CardDescription>{t('agentMcp.boundServersDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentMcpServers.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t('agentMcp.noBound')}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {currentMcpServers.map(entry => (
                <BoundServerItem
                  key={entry.id}
                  entry={entry}
                  agentId={agentId}
                  onRemove={() => handleRemove(entry.mcpServerId)}
                  isRemoving={
                    removeMcp.isPending &&
                    removeMcp.variables?.mcpServerId === entry.mcpServerId
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available MCP servers */}
      <Card>
        <CardHeader>
          <CardTitle>{t('agentMcp.availableServers')}</CardTitle>
          <CardDescription>
            {t('agentMcp.availableServersDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableServers.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t('agentMcp.noAvailable')}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {availableServers.map(server => (
                <div
                  key={server.id}
                  className="flex items-center justify-between rounded-md border px-4 py-3"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{server.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {server.transport}
                      </Badge>
                      {server.tools && (
                        <span className="text-muted-foreground text-xs">
                          {server.tools.length} {t('agentMcp.tools')}
                        </span>
                      )}
                    </div>
                    {server.description && (
                      <p className="text-muted-foreground text-xs">
                        {server.description}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAdd(server.id)}
                    disabled={addMcp.isPending}
                  >
                    {addMcp.isPending &&
                    addMcp.variables?.mcpServerId === server.id ? (
                      <Loader2 className="mr-1 size-3 animate-spin" />
                    ) : (
                      <Plus className="mr-1 size-3" />
                    )}
                    {t('agentMcp.add')}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BoundServerItem({
  entry,
  agentId,
  onRemove,
  isRemoving,
}: {
  entry: BoundMcpServer;
  agentId: string;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedTools, setSelectedTools] = useState<string[]>(
    entry.enabledTools
  );
  const updateMcp = useUpdateAgentMcp();

  useEffect(() => {
    setSelectedTools(entry.enabledTools);
  }, [entry.enabledTools]);

  const serverTools = entry.mcpServer.tools ?? [];
  const hasChanges =
    JSON.stringify([...selectedTools].sort()) !==
    JSON.stringify([...entry.enabledTools].sort());

  function handleToggleTool(toolName: string) {
    setSelectedTools(prev =>
      prev.includes(toolName)
        ? prev.filter(t => t !== toolName)
        : [...prev, toolName]
    );
  }

  function handleSelectAll() {
    setSelectedTools(serverTools.map(t => t.name));
  }

  function handleSelectNone() {
    setSelectedTools([]);
  }

  function handleSave() {
    updateMcp.mutate(
      {
        agentId,
        mcpServerId: entry.mcpServerId,
        enabledTools: selectedTools,
      },
      {
        onSuccess: () => {
          toast.success(t('agentMcp.saveTools'));
        },
      }
    );
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-md border"
    >
      <div className="flex items-center justify-between px-4 py-3">
        <CollapsibleTrigger className="flex items-center gap-2 text-left">
          {open ? (
            <ChevronDown className="text-muted-foreground size-4" />
          ) : (
            <ChevronRight className="text-muted-foreground size-4" />
          )}
          <span className="text-sm font-medium">{entry.mcpServer.name}</span>
          <Badge variant="outline" className="text-xs">
            {entry.mcpServer.transport}
          </Badge>
          <span className="text-muted-foreground text-xs">
            {entry.enabledTools.length > 0
              ? `${entry.enabledTools.length} / ${serverTools.length} ${t('agentMcp.tools')}`
              : serverTools.length > 0
                ? `${serverTools.length} ${t('agentMcp.tools')}`
                : t('mcp.noTools')}
          </span>
        </CollapsibleTrigger>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost-destructive"
              onClick={onRemove}
              disabled={isRemoving}
            >
              {isRemoving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('common.delete')}</TooltipContent>
        </Tooltip>
      </div>

      <CollapsibleContent>
        {serverTools.length > 0 ? (
          <>
            <Separator />
            <div className="px-4 py-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-muted-foreground text-xs">
                  {t('agentMcp.toolsDesc')}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={handleSelectAll}
                  >
                    {t('agentMcp.selectAll')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={handleSelectNone}
                  >
                    {t('agentMcp.clear')}
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {serverTools.map(tool => (
                  <label
                    key={tool.name}
                    className="flex items-start gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedTools.includes(tool.name)}
                      onCheckedChange={() => handleToggleTool(tool.name)}
                      className="mt-0.5"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{tool.name}</span>
                      {tool.description && (
                        <span className="text-muted-foreground text-xs">
                          {tool.description}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
              {hasChanges && (
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSave}
                    disabled={updateMcp.isPending}
                  >
                    {updateMcp.isPending ? (
                      <Loader2 className="mr-1 size-3 animate-spin" />
                    ) : (
                      <Check className="mr-1 size-3" />
                    )}
                    {t('agentMcp.saveTools')}
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Separator />
            <div className="px-4 py-3">
              <p className="text-muted-foreground text-xs">
                {t('agentMcp.noTools')}
              </p>
            </div>
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

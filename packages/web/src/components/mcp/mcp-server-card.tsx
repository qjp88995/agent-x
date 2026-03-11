import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import {
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@agent-x/design';
import type { McpServerResponse } from '@agent-x/shared';
import { Pencil, PlugZap, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useTestMcpServer } from '@/hooks/use-mcp';

import { TransportBadge } from './transport-badge';

interface McpServerCardProps {
  readonly server: McpServerResponse;
  readonly onDelete: (server: McpServerResponse) => void;
}

export function McpServerCard({ server, onDelete }: McpServerCardProps) {
  const { t } = useTranslation();
  const testMcpServer = useTestMcpServer();
  const toolCount = server.tools?.length ?? 0;

  function handleTest() {
    testMcpServer.mutate(server.id, {
      onSuccess: result => {
        if (result.success) {
          toast.success(t('mcp.testSuccess'));
        } else {
          toast.error(t('mcp.testFailed'));
        }
      },
      onError: () => {
        toast.error(t('mcp.testFailed'));
      },
    });
  }

  return (
    <Card className="flex flex-col hover:shadow-md hover:border-primary/20 transition-all duration-200">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base">{server.name}</CardTitle>
          <TransportBadge transport={server.transport} />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost-destructive"
              size="icon"
              className="size-8"
              onClick={() => onDelete(server)}
            >
              <Trash2 className="size-4" />
              <span className="sr-only">{t('common.delete')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('common.delete')}</TooltipContent>
        </Tooltip>
      </CardHeader>

      <CardContent className="flex-1">
        {server.description ? (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {server.description}
          </p>
        ) : (
          <p className="text-muted-foreground/50 text-sm italic">
            {t('common.noDescription')}
          </p>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="flex w-full items-center justify-between">
          <div className="text-muted-foreground text-sm">
            {toolCount > 0
              ? t('mcp.toolCount', { count: toolCount })
              : t('mcp.noTools')}
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={handleTest}
                  disabled={testMcpServer.isPending}
                >
                  <PlugZap className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {testMcpServer.isPending
                  ? t('mcp.testing')
                  : t('mcp.testConnection')}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7" asChild>
                  <Link to={`/mcp-servers/${server.id}/edit`}>
                    <Pencil className="size-3.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('common.edit')}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

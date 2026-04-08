import { useTranslation } from 'react-i18next';

import { Badge } from '@agent-x/design';
import type { McpTransport as McpTransportType } from '@agent-x/shared';

import { cn } from '@/lib/utils';

const TRANSPORT_BADGE_CONFIG: Record<McpTransportType, { className: string }> =
  {
    STDIO: {
      className:
        'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    },
    SSE: {
      className:
        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    },
    STREAMABLE_HTTP: {
      className:
        'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    },
  };

const TRANSPORT_LABEL_KEY: Record<McpTransportType, string> = {
  STDIO: 'mcp.stdio',
  SSE: 'mcp.sse',
  STREAMABLE_HTTP: 'mcp.streamableHttp',
};

export function TransportBadge({
  transport,
}: {
  readonly transport: McpTransportType;
}) {
  const { t } = useTranslation();
  const config = TRANSPORT_BADGE_CONFIG[transport];
  return (
    <Badge variant="outline" className={cn('border-0', config.className)}>
      {t(TRANSPORT_LABEL_KEY[transport])}
    </Badge>
  );
}

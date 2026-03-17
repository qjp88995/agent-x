import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button, EmptyState } from '@agent-x/design';
import { Plus, Server } from 'lucide-react';

interface McpEmptyStateProps {
  readonly tab: 'marketplace' | 'custom';
  readonly isAdmin: boolean;
}

export function McpEmptyState({ tab, isAdmin }: McpEmptyStateProps) {
  const { t } = useTranslation();
  const isMarketplace = tab === 'marketplace';

  const actionTo =
    isMarketplace && isAdmin
      ? '/mcp-servers/new?type=official'
      : !isMarketplace
        ? '/mcp-servers/new'
        : undefined;

  const actionLabel =
    isMarketplace && isAdmin
      ? t('mcp.addToMarketplace')
      : !isMarketplace
        ? t('mcp.addServer')
        : undefined;

  return (
    <EmptyState
      icon={Server}
      title={isMarketplace ? t('mcp.noMarketplace') : t('mcp.noCustom')}
      description={
        isMarketplace ? t('mcp.noMarketplaceDesc') : t('mcp.noCustomDesc')
      }
      action={
        actionTo && actionLabel ? (
          <Button asChild variant="primary">
            <Link to={actionTo}>
              <Plus className="mr-2 size-4" />
              {actionLabel}
            </Link>
          </Button>
        ) : undefined
      }
    />
  );
}

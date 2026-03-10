import { useTranslation } from 'react-i18next';

import { Server } from 'lucide-react';

import { EmptyState } from '@/components/shared/empty-state';

interface McpEmptyStateProps {
  readonly tab: 'marketplace' | 'custom';
  readonly isAdmin: boolean;
}

export function McpEmptyState({ tab, isAdmin }: McpEmptyStateProps) {
  const { t } = useTranslation();
  const isMarketplace = tab === 'marketplace';

  return (
    <EmptyState
      icon={Server}
      title={isMarketplace ? t('mcp.noMarketplace') : t('mcp.noCustom')}
      description={
        isMarketplace ? t('mcp.noMarketplaceDesc') : t('mcp.noCustomDesc')
      }
      actionLabel={
        isMarketplace && isAdmin
          ? t('mcp.addToMarketplace')
          : !isMarketplace
            ? t('mcp.addServer')
            : undefined
      }
      actionTo={
        isMarketplace && isAdmin
          ? '/mcp-servers/new?type=official'
          : !isMarketplace
            ? '/mcp-servers/new'
            : undefined
      }
    />
  );
}

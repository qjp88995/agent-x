import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Plus, Server } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface McpEmptyStateProps {
  readonly tab: 'marketplace' | 'custom';
  readonly isAdmin: boolean;
}

export function McpEmptyState({ tab, isAdmin }: McpEmptyStateProps) {
  const { t } = useTranslation();
  const isMarketplace = tab === 'marketplace';

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="gradient-bg text-white flex size-16 items-center justify-center rounded-full mb-4">
        <Server className="size-8" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">
        {isMarketplace ? t('mcp.noMarketplace') : t('mcp.noCustom')}
      </h3>
      <p className="text-muted-foreground mb-6 text-sm">
        {isMarketplace ? t('mcp.noMarketplaceDesc') : t('mcp.noCustomDesc')}
      </p>
      {isMarketplace && isAdmin && (
        <Button asChild variant="primary">
          <Link to="/mcp-servers/new?type=official">
            <Plus className="mr-2 size-4" />
            {t('mcp.addToMarketplace')}
          </Link>
        </Button>
      )}
      {!isMarketplace && (
        <Button asChild variant="primary">
          <Link to="/mcp-servers/new">
            <Plus className="mr-2 size-4" />
            {t('mcp.addServer')}
          </Link>
        </Button>
      )}
    </div>
  );
}

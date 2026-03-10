import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { MessageSquarePlus, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface PromptEmptyStateProps {
  readonly tab: 'marketplace' | 'custom';
  readonly isAdmin: boolean;
}

export function PromptEmptyState({ tab, isAdmin }: PromptEmptyStateProps) {
  const { t } = useTranslation();
  const isMarketplace = tab === 'marketplace';

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="gradient-bg text-white flex size-16 items-center justify-center rounded-full mb-4">
        <MessageSquarePlus className="size-8" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">
        {isMarketplace
          ? t('prompts.noSystemPrompts')
          : t('prompts.noCustomPrompts')}
      </h3>
      <p className="text-muted-foreground mb-6 text-sm">
        {isMarketplace
          ? t('prompts.noSystemPromptsDesc')
          : t('prompts.noCustomPromptsDesc')}
      </p>
      {isMarketplace && isAdmin && (
        <Button asChild variant="primary">
          <Link to="/prompts/new?type=system">
            <Plus className="mr-2 size-4" />
            {t('prompts.addToMarketplace')}
          </Link>
        </Button>
      )}
      {!isMarketplace && (
        <Button asChild variant="primary">
          <Link to="/prompts/new">
            <Plus className="mr-2 size-4" />
            {t('prompts.createPrompt')}
          </Link>
        </Button>
      )}
    </div>
  );
}

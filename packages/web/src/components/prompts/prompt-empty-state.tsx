import { useTranslation } from 'react-i18next';

import { MessageSquarePlus } from 'lucide-react';

import { EmptyState } from '@/components/shared/empty-state';

interface PromptEmptyStateProps {
  readonly tab: 'marketplace' | 'custom';
  readonly isAdmin: boolean;
}

export function PromptEmptyState({ tab, isAdmin }: PromptEmptyStateProps) {
  const { t } = useTranslation();
  const isMarketplace = tab === 'marketplace';

  return (
    <EmptyState
      icon={MessageSquarePlus}
      title={
        isMarketplace
          ? t('prompts.noSystemPrompts')
          : t('prompts.noCustomPrompts')
      }
      description={
        isMarketplace
          ? t('prompts.noSystemPromptsDesc')
          : t('prompts.noCustomPromptsDesc')
      }
      actionLabel={
        isMarketplace && isAdmin
          ? t('prompts.addToMarketplace')
          : !isMarketplace
            ? t('prompts.createPrompt')
            : undefined
      }
      actionTo={
        isMarketplace && isAdmin
          ? '/prompts/new?type=system'
          : !isMarketplace
            ? '/prompts/new'
            : undefined
      }
    />
  );
}

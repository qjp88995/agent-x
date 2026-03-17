import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button, EmptyState } from '@agent-x/design';
import { MessageSquarePlus, Plus } from 'lucide-react';

interface PromptEmptyStateProps {
  readonly tab: 'marketplace' | 'custom';
  readonly isAdmin: boolean;
}

export function PromptEmptyState({ tab, isAdmin }: PromptEmptyStateProps) {
  const { t } = useTranslation();
  const isMarketplace = tab === 'marketplace';

  const actionTo =
    isMarketplace && isAdmin
      ? '/prompts/new?type=system'
      : !isMarketplace
        ? '/prompts/new'
        : undefined;

  const actionLabel =
    isMarketplace && isAdmin
      ? t('prompts.addToMarketplace')
      : !isMarketplace
        ? t('prompts.createPrompt')
        : undefined;

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

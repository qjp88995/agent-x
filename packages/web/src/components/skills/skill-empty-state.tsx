import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button, EmptyState } from '@agent-x/design';
import { Plus, Sparkles } from 'lucide-react';

interface SkillEmptyStateProps {
  readonly tab: 'marketplace' | 'custom';
  readonly isAdmin: boolean;
}

export function SkillEmptyState({ tab, isAdmin }: SkillEmptyStateProps) {
  const { t } = useTranslation();
  const isMarketplace = tab === 'marketplace';

  const actionTo =
    isMarketplace && isAdmin
      ? '/skills/new?type=system'
      : !isMarketplace
        ? '/skills/new'
        : undefined;

  const actionLabel =
    isMarketplace && isAdmin
      ? t('skills.addToMarketplace')
      : !isMarketplace
        ? t('skills.createSkill')
        : undefined;

  return (
    <EmptyState
      icon={Sparkles}
      title={
        isMarketplace ? t('skills.noSystemSkills') : t('skills.noCustomSkills')
      }
      description={
        isMarketplace
          ? t('skills.noSystemSkillsDesc')
          : t('skills.noCustomSkillsDesc')
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

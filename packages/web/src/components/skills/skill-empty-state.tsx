import { useTranslation } from 'react-i18next';

import { Sparkles } from 'lucide-react';

import { EmptyState } from '@/components/shared/empty-state';

interface SkillEmptyStateProps {
  readonly tab: 'marketplace' | 'custom';
  readonly isAdmin: boolean;
}

export function SkillEmptyState({ tab, isAdmin }: SkillEmptyStateProps) {
  const { t } = useTranslation();
  const isMarketplace = tab === 'marketplace';

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
      actionLabel={
        isMarketplace && isAdmin
          ? t('skills.addToMarketplace')
          : !isMarketplace
            ? t('skills.createSkill')
            : undefined
      }
      actionTo={
        isMarketplace && isAdmin
          ? '/skills/new?type=system'
          : !isMarketplace
            ? '/skills/new'
            : undefined
      }
    />
  );
}

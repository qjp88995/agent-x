import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Plus, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface SkillEmptyStateProps {
  readonly tab: 'marketplace' | 'custom';
  readonly isAdmin: boolean;
}

export function SkillEmptyState({ tab, isAdmin }: SkillEmptyStateProps) {
  const { t } = useTranslation();
  const isMarketplace = tab === 'marketplace';

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="gradient-bg text-white flex size-16 items-center justify-center rounded-full mb-4">
        <Sparkles className="size-8" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">
        {isMarketplace
          ? t('skills.noSystemSkills')
          : t('skills.noCustomSkills')}
      </h3>
      <p className="text-muted-foreground mb-6 text-sm">
        {isMarketplace
          ? t('skills.noSystemSkillsDesc')
          : t('skills.noCustomSkillsDesc')}
      </p>
      {isMarketplace && isAdmin && (
        <Button asChild variant="primary">
          <Link to="/skills/new?type=system">
            <Plus className="mr-2 size-4" />
            {t('skills.addToMarketplace')}
          </Link>
        </Button>
      )}
      {!isMarketplace && (
        <Button asChild variant="primary">
          <Link to="/skills/new">
            <Plus className="mr-2 size-4" />
            {t('skills.createSkill')}
          </Link>
        </Button>
      )}
    </div>
  );
}

import { useTranslation } from 'react-i18next';

import { Bot } from 'lucide-react';

import { EmptyState } from '@/components/shared/empty-state';

export function AgentEmptyState() {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={Bot}
      title={t('agents.noAgents')}
      description={t('agents.noAgentsDesc')}
      actionLabel={t('agents.createAgent')}
      actionTo="/agents/new"
    />
  );
}

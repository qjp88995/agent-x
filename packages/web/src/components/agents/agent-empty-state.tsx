import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button, EmptyState } from '@agent-x/design';
import { Bot, Plus } from 'lucide-react';

export function AgentEmptyState() {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={Bot}
      title={t('agents.noAgents')}
      description={t('agents.noAgentsDesc')}
      action={
        <Button asChild variant="primary">
          <Link to="/agents/new">
            <Plus className="mr-2 size-4" />
            {t('agents.createAgent')}
          </Link>
        </Button>
      }
    />
  );
}

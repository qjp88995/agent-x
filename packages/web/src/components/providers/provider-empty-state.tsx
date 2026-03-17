import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button, EmptyState } from '@agent-x/design';
import { Plus, Unplug } from 'lucide-react';

export function ProviderEmptyState() {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={Unplug}
      title={t('providers.noProviders')}
      description={t('providers.noProvidersDesc')}
      action={
        <Button asChild variant="primary">
          <Link to="/providers/new">
            <Plus className="mr-2 size-4" />
            {t('providers.addProvider')}
          </Link>
        </Button>
      }
    />
  );
}

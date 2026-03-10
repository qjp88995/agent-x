import { useTranslation } from 'react-i18next';

import { Unplug } from 'lucide-react';

import { EmptyState } from '@/components/shared/empty-state';

export function ProviderEmptyState() {
  const { t } = useTranslation();

  return (
    <EmptyState
      icon={Unplug}
      title={t('providers.noProviders')}
      description={t('providers.noProvidersDesc')}
      actionLabel={t('providers.addProvider')}
      actionTo="/providers/new"
    />
  );
}

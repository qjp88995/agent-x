import { useTranslation } from 'react-i18next';

import { PageHeader } from '@agent-x/design';

export default function MarketplacePage() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t('marketplace.title')}
        description={t('marketplace.subtitle')}
      />
      <div className="flex-1 overflow-auto p-5">
        <p className="text-foreground-muted text-sm">Coming soon...</p>
      </div>
    </div>
  );
}

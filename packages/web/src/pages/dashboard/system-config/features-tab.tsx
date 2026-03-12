import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingsAccordion, Skeleton } from '@agent-x/design';
import { AlertTriangle, Wrench } from 'lucide-react';

import { EmptyState } from '@/components/shared/empty-state';
import {
  useSystemFeatures,
  useSystemProviders,
} from '@/hooks/use-system-config';

import { FeatureAccordionItem } from './feature-row';

export function FeaturesTab() {
  const { t } = useTranslation();
  const { data: features, isLoading, error } = useSystemFeatures();
  const { data: providers } = useSystemProviders();
  const [expanded, setExpanded] = useState('');

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">
          {t('common.failedToLoad', {
            resource: t('systemConfig.featuresTab').toLowerCase(),
          })}
        </h3>
        <p className="text-foreground-muted text-sm">
          {t('common.tryRefreshing')}
        </p>
      </div>
    );
  }

  if (!features || features.length === 0) {
    return <EmptyState icon={Wrench} title={t('common.noResults')} />;
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold">
          {t('systemConfig.featuresTab')}
        </h2>
        <p className="text-foreground-muted mt-0.5 text-sm">
          {t('systemConfig.subtitle')}
        </p>
      </div>

      <SettingsAccordion value={expanded} onValueChange={setExpanded}>
        {features.map(feature => (
          <FeatureAccordionItem
            key={feature.id}
            feature={feature}
            providers={providers ?? []}
          />
        ))}
      </SettingsAccordion>
    </div>
  );
}

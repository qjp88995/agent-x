import { useTranslation } from 'react-i18next';

import { AlertTriangle, Wrench } from 'lucide-react';

import {
  useSystemFeatures,
  useSystemProviders,
} from '@/hooks/use-system-config';

import { FeatureRow } from './feature-row';

export function FeaturesTab() {
  const { t } = useTranslation();
  const { data: features, isLoading, error } = useSystemFeatures();
  const { data: providers } = useSystemProviders();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-foreground-muted text-sm">
          {t('common.loading')}
        </div>
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

  return (
    <div className="flex flex-col gap-6">
      {!features || features.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <div className="gradient-bg mb-4 flex size-16 items-center justify-center rounded-full text-white">
            <Wrench className="size-8" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">
            {t('common.noResults')}
          </h3>
        </div>
      ) : (
        <div className="flex max-w-4xl flex-col gap-4">
          {features.map(feature => (
            <FeatureRow
              key={feature.id}
              feature={feature}
              providers={providers ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { useTranslation } from 'react-i18next';

import { Skeleton, StaggerItem, StaggerList } from '@agent-x/design';
import { AlertTriangle, Wrench } from 'lucide-react';

import {
  useSystemFeatures,
  useSystemProviders,
} from '@/hooks/use-system-config';

import { FeatureRow } from './feature-row';

function FeaturesSkeleton() {
  return (
    <div className="flex max-w-4xl flex-col gap-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={i} className="h-64 rounded-lg" />
      ))}
    </div>
  );
}

export function FeaturesTab() {
  const { t } = useTranslation();
  const { data: features, isLoading, error } = useSystemFeatures();
  const { data: providers } = useSystemProviders();

  if (isLoading) {
    return <FeaturesSkeleton />;
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
          <div className="bg-primary mb-4 flex size-16 items-center justify-center rounded-full text-white">
            <Wrench className="size-8" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">
            {t('common.noResults')}
          </h3>
        </div>
      ) : (
        <StaggerList className="flex max-w-4xl flex-col gap-4">
          {features.map(feature => (
            <StaggerItem key={feature.id}>
              <FeatureRow feature={feature} providers={providers ?? []} />
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </div>
  );
}

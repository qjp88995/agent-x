import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  PageHeader,
  SettingsLayout,
  SettingsNav,
  SettingsNavGroup,
  SettingsNavItem,
} from '@agent-x/design';
import { Plug, Settings } from 'lucide-react';

import {
  useSystemFeatures,
  useSystemProviders,
} from '@/hooks/use-system-config';

import { FeaturesTab } from './features-tab';
import { ProvidersTab } from './providers-tab';

export default function SystemConfigPage() {
  const { t } = useTranslation();
  const [section, setSection] = useState('providers');
  const { data: providers } = useSystemProviders();
  const { data: features } = useSystemFeatures();

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t('systemConfig.title')}
        description={t('systemConfig.subtitle')}
      />

      <SettingsLayout
        sidebar={
          <SettingsNav value={section} onValueChange={setSection}>
            <SettingsNavGroup
              title={t('systemConfig.sections.aiConfiguration')}
            >
              <SettingsNavItem
                value="providers"
                icon={Plug}
                count={providers?.length}
              >
                {t('systemConfig.providers')}
              </SettingsNavItem>
              <SettingsNavItem
                value="features"
                icon={Settings}
                count={features?.length}
              >
                {t('systemConfig.featuresTab')}
              </SettingsNavItem>
            </SettingsNavGroup>
          </SettingsNav>
        }
      >
        {section === 'providers' && <ProvidersTab />}
        {section === 'features' && <FeaturesTab />}
      </SettingsLayout>
    </div>
  );
}

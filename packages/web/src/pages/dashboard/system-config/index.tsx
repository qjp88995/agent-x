import { useTranslation } from 'react-i18next';

import {
  PageHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@agent-x/design';

import { FeaturesTab } from './features-tab';
import { ProvidersTab } from './providers-tab';

export default function SystemConfigPage() {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t('systemConfig.title')}
        description={t('systemConfig.subtitle')}
      />

      <div className="flex-1 overflow-auto p-5">
        <Tabs defaultValue="providers">
          <TabsList>
            <TabsTrigger value="providers">
              {t('systemConfig.providers')}
            </TabsTrigger>
            <TabsTrigger value="features">
              {t('systemConfig.featuresTab')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="providers">
            <ProvidersTab />
          </TabsContent>
          <TabsContent value="features">
            <FeaturesTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

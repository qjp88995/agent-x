import { useTranslation } from 'react-i18next';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { FeaturesTab } from './features-tab';
import { ProvidersTab } from './providers-tab';

export default function SystemConfigPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('systemConfig.title')}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t('systemConfig.subtitle')}
        </p>
      </div>

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
  );
}

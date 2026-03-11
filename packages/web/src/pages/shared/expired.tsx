import { useTranslation } from 'react-i18next';

import { Button } from '@agent-x/design';
import { LinkIcon } from 'lucide-react';

export default function SharedExpiredPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <div className="gradient-bg flex size-16 items-center justify-center rounded-full glow-sm opacity-80">
        <LinkIcon className="text-white size-8" />
      </div>
      <h1 className="text-xl font-semibold">{t('shared.expired')}</h1>
      <p className="text-foreground-muted max-w-md text-center text-sm">
        {t('shared.expiredDesc')}
      </p>
      <Button variant="outline" asChild>
        <a href="/">{t('shared.goHome')}</a>
      </Button>
    </div>
  );
}

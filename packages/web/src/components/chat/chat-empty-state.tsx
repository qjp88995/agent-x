import { useTranslation } from 'react-i18next';

import { MessageSquare } from 'lucide-react';

export function ChatEmptyState() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="bg-primary mb-4 flex size-16 items-center justify-center rounded-full">
        <MessageSquare className="size-8 text-white" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">
        {t('chat.selectConversation')}
      </h3>
      <p className="text-foreground-muted text-sm">
        {t('chat.chooseConversation')}
      </p>
    </div>
  );
}

import { useTranslation } from 'react-i18next';

import { Bot } from 'lucide-react';

interface SharedWelcomeProps {
  readonly agentName: string;
  readonly agentDescription?: string | null;
}

export function SharedWelcome({
  agentName,
  agentDescription,
}: SharedWelcomeProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="bg-primary mb-4 flex size-16 items-center justify-center rounded-full">
        <Bot className="size-8 text-white" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{agentName}</h3>
      <p className="text-foreground-muted text-sm">
        {agentDescription ?? t('chat.startConversation')}
      </p>
    </div>
  );
}

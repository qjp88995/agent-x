import { useTranslation } from 'react-i18next';

import { Clock, Globe, Loader2 } from 'lucide-react';

interface TimeCardProps {
  readonly state: string;
  readonly output?: {
    readonly localTime?: string;
    readonly timezone?: string;
    readonly error?: string;
  };
}

export function TimeCard({ state, output }: TimeCardProps) {
  const { t } = useTranslation();
  const loading = state === 'input-streaming' || state === 'input-available';

  if (loading) {
    return (
      <div className="my-1 flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-2 text-sm">
        <Loader2 className="text-primary size-4 shrink-0 animate-spin" />
        <span className="text-muted-foreground text-xs">
          {t('toolCall.gettingTime')}
        </span>
      </div>
    );
  }

  if (state === 'output-error' || output?.error) {
    return (
      <div className="my-1 flex items-center gap-2 rounded-lg border border-red-300/40 bg-card px-3 py-2 text-sm">
        <Clock className="size-4 shrink-0 text-red-500" />
        <span className="text-muted-foreground text-xs">
          {output?.error ?? t('toolCall.error')}
        </span>
      </div>
    );
  }

  return (
    <div className="my-1 flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-2 text-sm">
      <Clock className="text-muted-foreground size-4 shrink-0" />
      <span className="font-mono text-xs">{output?.localTime}</span>
      {output?.timezone && (
        <>
          <Globe className="text-muted-foreground/60 size-3 shrink-0" />
          <span className="text-muted-foreground text-[10px]">
            {output.timezone}
          </span>
        </>
      )}
    </div>
  );
}

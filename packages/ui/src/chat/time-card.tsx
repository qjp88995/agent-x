import { Clock, Globe, Loader2 } from 'lucide-react';

interface TimeCardProps {
  readonly state: string;
  readonly output?: {
    readonly localTime?: string;
    readonly timezone?: string;
    readonly error?: string;
  };
  readonly labels?: {
    loading?: string;
    error?: string;
  };
}

const defaultLabels = {
  loading: 'Getting time\u2026',
  error: 'Error',
};

export function TimeCard({ state, output, labels }: TimeCardProps) {
  const merged = { ...defaultLabels, ...labels };
  const loading = state === 'input-streaming' || state === 'input-available';

  if (loading) {
    return (
      <div className="my-1 flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-2 text-sm">
        <Loader2 className="text-primary size-4 shrink-0 animate-spin" />
        <span className="text-foreground-muted text-xs">{merged.loading}</span>
      </div>
    );
  }

  if (state === 'output-error' || output?.error) {
    return (
      <div className="my-1 flex items-center gap-2 rounded-lg border border-red-300/40 bg-card px-3 py-2 text-sm">
        <Clock className="size-4 shrink-0 text-red-500" />
        <span className="text-foreground-muted text-xs">
          {output?.error ?? merged.error}
        </span>
      </div>
    );
  }

  return (
    <div className="my-1 flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-2 text-sm">
      <Clock className="text-foreground-muted size-4 shrink-0" />
      <span className="font-mono text-xs">{output?.localTime}</span>
      {output?.timezone && (
        <>
          <Globe className="text-foreground-muted/60 size-3 shrink-0" />
          <span className="text-foreground-muted text-[10px]">
            {output.timezone}
          </span>
        </>
      )}
    </div>
  );
}

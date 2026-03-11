import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@agent-x/design';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Wrench,
} from 'lucide-react';

import { cn } from '@/lib/utils';

type ToolState =
  | 'input-streaming'
  | 'input-available'
  | 'output-available'
  | 'output-error';

interface ToolCallBlockProps {
  readonly toolName: string;
  readonly state: ToolState;
  readonly input?: unknown;
  readonly output?: unknown;
  readonly errorText?: string;
}

function StatusIndicator({ state }: { readonly state: ToolState }) {
  switch (state) {
    case 'input-streaming':
    case 'input-available':
      return (
        <Loader2
          aria-hidden="true"
          className="text-primary ml-auto size-3 animate-spin"
        />
      );
    case 'output-available':
      return (
        <CheckCircle2
          aria-hidden="true"
          className="ml-auto size-3 text-green-500"
        />
      );
    case 'output-error':
      return (
        <AlertCircle
          aria-hidden="true"
          className="ml-auto size-3 text-red-500"
        />
      );
  }
}

const statusLabelKeys: Record<ToolState, string> = {
  'input-streaming': 'toolCall.preparing',
  'input-available': 'toolCall.calling',
  'output-available': 'toolCall.completed',
  'output-error': 'toolCall.error',
};

function JsonBlock({ data }: { readonly data: unknown }) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return (
    <pre className="overflow-x-auto text-[11px] leading-relaxed whitespace-pre-wrap break-all">
      {text}
    </pre>
  );
}

export function ToolCallBlock({
  toolName,
  state,
  input,
  output,
  errorText,
}: ToolCallBlockProps) {
  const { t } = useTranslation();
  const regionId = useId();
  const isDone = state === 'output-available' || state === 'output-error';
  const [userToggled, setUserToggled] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const open = userToggled ? manualOpen : !isDone;

  return (
    <Collapsible
      open={open}
      onOpenChange={v => {
        setUserToggled(true);
        setManualOpen(v);
      }}
      className={cn(
        'mb-3 overflow-hidden rounded-lg border font-mono text-xs',
        state === 'output-error' ? 'border-red-300/40' : 'border-border/40'
      )}
    >
      <CollapsibleTrigger
        aria-controls={regionId}
        className="bg-surface/20 hover:bg-surface/40 text-foreground-muted flex w-full items-center gap-2 px-3 py-2 transition-colors"
      >
        {open ? (
          <ChevronDown aria-hidden="true" className="size-3 shrink-0" />
        ) : (
          <ChevronRight aria-hidden="true" className="size-3 shrink-0" />
        )}
        <Wrench aria-hidden="true" className="size-3 shrink-0" />
        <span className="text-[10px] uppercase tracking-wider">{toolName}</span>
        <span className="text-foreground-muted/60 text-[10px]">
          {t(statusLabelKeys[state])}
        </span>
        <StatusIndicator state={state} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div
          id={regionId}
          role="region"
          aria-label={`Tool call: ${toolName}`}
          className="bg-surface/10 text-foreground-muted/80 max-h-64 space-y-2 overflow-y-auto px-3 py-2"
        >
          {input != null && (
            <div>
              <div className="text-foreground-muted/50 mb-1 text-[10px] uppercase tracking-wider">
                {t('toolCall.input')}
              </div>
              <JsonBlock data={input} />
            </div>
          )}
          {state === 'output-available' && output != null && (
            <div>
              <div className="text-foreground-muted/50 mb-1 text-[10px] uppercase tracking-wider">
                {t('toolCall.output')}
              </div>
              <JsonBlock data={output} />
            </div>
          )}
          {state === 'output-error' && errorText && (
            <div className="text-red-400">{errorText}</div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

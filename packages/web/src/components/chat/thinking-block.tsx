import { useId, useState } from 'react';

import { Brain,ChevronDown, ChevronRight } from 'lucide-react';

interface ThinkingBlockProps {
  readonly content: string;
  readonly done: boolean;
}

export function ThinkingBlock({ content, done }: ThinkingBlockProps) {
  const regionId = useId();
  const [userToggled, setUserToggled] = useState(false);
  const [manualOpen, setManualOpen] = useState(true);
  const open = userToggled ? manualOpen : !done;

  return (
    <div className="border-border/40 mb-3 overflow-hidden rounded-lg border font-mono text-xs">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => {
          setUserToggled(true);
          setManualOpen(v => !v);
        }}
        className="bg-muted/20 hover:bg-muted/40 text-muted-foreground flex w-full items-center gap-2 px-3 py-2 transition-colors"
      >
        {open ? (
          <ChevronDown aria-hidden="true" className="size-3 shrink-0" />
        ) : (
          <ChevronRight aria-hidden="true" className="size-3 shrink-0" />
        )}
        <Brain aria-hidden="true" className="size-3 shrink-0" />
        <span className="text-[10px] uppercase tracking-wider">
          {done ? 'View thinking' : 'Thinking...'}
        </span>
        {!done && (
          <span className="bg-primary ml-auto inline-block size-1.5 animate-pulse rounded-full" />
        )}
      </button>
      {open && (
        <div
          id={regionId}
          role="region"
          aria-label="Thinking process"
          className="bg-muted/10 text-muted-foreground/80 max-h-64 overflow-y-auto px-3 py-2 leading-relaxed whitespace-pre-wrap"
        >
          {content || '...'}
        </div>
      )}
    </div>
  );
}

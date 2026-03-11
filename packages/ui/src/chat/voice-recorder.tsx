import { cn } from '../lib/utils';
import { Square, X, Loader2 } from 'lucide-react';

type VoiceRecorderState = 'recording' | 'transcribing';

type VoiceRecorderProps = {
  state: VoiceRecorderState;
  duration?: number; // seconds elapsed
  onCancel: () => void;
  onStop: () => void;
  className?: string;
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Decorative waveform bars with varying heights
const WAVEFORM_HEIGHTS = [12, 20, 16, 24, 14, 22, 10] as const;

function VoiceRecorder({
  state,
  duration = 0,
  onCancel,
  onStop,
  className,
}: VoiceRecorderProps) {
  if (state === 'transcribing') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] border border-border bg-card',
          className
        )}
      >
        <Loader2 className="size-4 text-foreground-muted animate-spin shrink-0" />
        <span className="flex-1 text-[12px] text-foreground-secondary">
          Transcribing...
        </span>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel transcription"
          className="shrink-0 flex items-center justify-center size-6 rounded-[var(--radius-sm)] text-foreground-ghost hover:text-foreground-muted hover:bg-surface transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </div>
    );
  }

  // recording state
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] border border-red-500/60 bg-card',
        className
      )}
    >
      {/* Left: pulse dot + timer */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="size-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[12px] font-mono text-foreground-secondary tabular-nums">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Center: decorative waveform bars */}
      <div
        className="flex-1 flex items-center justify-center gap-[3px]"
        aria-hidden
      >
        {WAVEFORM_HEIGHTS.map((h, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-red-400/70 animate-pulse"
            style={{
              height: `${h}px`,
              animationDelay: `${i * 80}ms`,
            }}
          />
        ))}
      </div>

      {/* Right: cancel + stop buttons */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel recording"
          className="flex items-center justify-center size-6 rounded-[var(--radius-sm)] text-foreground-ghost hover:text-foreground-muted hover:bg-surface transition-colors"
        >
          <X className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop recording and send"
          className="flex items-center justify-center size-6 rounded-[var(--radius-sm)] text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Square className="size-3.5 fill-current" />
        </button>
      </div>
    </div>
  );
}

export { VoiceRecorder, type VoiceRecorderState };

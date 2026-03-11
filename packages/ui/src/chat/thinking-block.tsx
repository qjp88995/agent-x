import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

type ThinkingBlockProps = {
  duration?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

function ThinkingBlock({ duration, children, defaultOpen = false, className }: ThinkingBlockProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div
      className={cn(
        'border border-primary/20 rounded-md overflow-hidden',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 w-full px-3 py-2 text-[11px] text-foreground-muted hover:text-foreground-secondary transition-colors text-left"
      >
        <ChevronRight
          className={cn('size-3 transition-transform duration-150 shrink-0', open && 'rotate-90')}
        />
        <span>Thinking</span>
        {duration != null && (
          <span className="text-foreground-ghost ml-0.5">&middot; {duration}s</span>
        )}
        {duration == null && (
          <span className="inline-flex items-center gap-0.5 ml-0.5">
            <span className="size-1 rounded-full bg-primary animate-pulse" />
            <span className="size-1 rounded-full bg-primary animate-pulse [animation-delay:0.15s]" />
            <span className="size-1 rounded-full bg-primary animate-pulse [animation-delay:0.3s]" />
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-3 pb-3 text-[12px] text-foreground-muted leading-relaxed border-t border-primary/10">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { ThinkingBlock };

import { type ComponentProps } from 'react';

import { cn } from '../lib/utils';

function Textarea({ className, ref, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'flex min-h-20 w-full rounded-md border border-border bg-card px-3 py-2 text-[13px] text-foreground-secondary placeholder:text-foreground-ghost focus-visible:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-(--duration-fast) resize-none',
        className
      )}
      ref={ref}
      {...props}
    />
  );
}

export { Textarea };

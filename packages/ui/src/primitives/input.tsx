import { type ComponentProps } from 'react';
import { cn } from '../lib/utils';

function Input({ className, type, ref, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-8 w-full rounded-md border border-border bg-card px-3 text-[13px] text-foreground-secondary placeholder:text-foreground-ghost focus-visible:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-(--duration-fast)',
        className
      )}
      ref={ref}
      {...props}
    />
  );
}

export { Input };

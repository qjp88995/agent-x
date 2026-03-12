import { type ComponentProps } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-border bg-card text-foreground-muted',
        success: 'border-transparent bg-[rgba(16,185,129,0.1)] text-primary',
        warning: 'border-transparent bg-[rgba(245,158,11,0.1)] text-warning',
        destructive:
          'border-transparent bg-[rgba(239,68,68,0.1)] text-destructive',
        info: 'border-transparent bg-[rgba(59,130,246,0.1)] text-info',
        muted: 'border-transparent bg-card text-foreground-ghost',
        outline: 'border-border bg-transparent text-foreground-muted',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends ComponentProps<'div'>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ref, ...props }: BadgeProps) {
  return (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Badge, badgeVariants };

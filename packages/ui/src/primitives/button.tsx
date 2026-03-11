import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm text-[11px] font-medium transition-all duration-120 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:bg-border-subtle disabled:text-foreground-ghost [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 cursor-pointer',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:brightness-110',
        default: 'bg-foreground text-background hover:opacity-90',
        outline:
          'border border-border bg-transparent text-foreground-secondary hover:bg-card',
        ghost: 'text-foreground-secondary hover:bg-card',
        destructive:
          'bg-destructive text-destructive-foreground hover:brightness-110',
        'ghost-destructive': 'text-destructive hover:bg-destructive/10',
      },
      size: {
        default: 'h-8 px-3',
        sm: 'h-7 px-2.5',
        lg: 'h-9 px-4 text-[12px]',
        icon: 'h-8 w-8',
        'icon-sm': 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

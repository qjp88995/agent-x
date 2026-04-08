import { ComponentProps, HTMLAttributes } from 'react';

import {
  Action,
  Cancel,
  Content,
  Description,
  Overlay,
  Portal,
  Root,
  Title,
  Trigger,
} from '@radix-ui/react-alert-dialog';

import { cn } from '../lib/utils';

const AlertDialog = Root;
const AlertDialogTrigger = Trigger;
const AlertDialogPortal = Portal;

const AlertDialogOverlay = ({ className, ref, ...props }: ComponentProps<typeof Overlay>) => (
  <Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/60',
      'animate-in fade-in-0',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
      className,
    )}
    {...props}
  />
);

interface AlertDialogContentProps extends ComponentProps<typeof Content> {
  variant?: 'default' | 'destructive';
}

const AlertDialogContent = ({ className, variant = 'default', ref, ...props }: AlertDialogContentProps) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <Content
      ref={ref}
      data-variant={variant}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
        'w-full max-w-md',
        'bg-card border border-border rounded-lg shadow-lg',
        'p-6',
        'animate-in fade-in-0 zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        variant === 'destructive' && 'border-t-2 border-t-destructive',
        className,
      )}
      {...props}
    />
  </AlertDialogPortal>
);

const AlertDialogHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5 mb-4', className)} {...props} />
);

const AlertDialogFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex justify-end gap-2 mt-4', className)} {...props} />
);

const AlertDialogTitle = ({ className, ref, ...props }: ComponentProps<typeof Title>) => (
  <Title
    ref={ref}
    className={cn('text-[13px] font-semibold text-foreground', className)}
    {...props}
  />
);

const AlertDialogDescription = ({ className, ref, ...props }: ComponentProps<typeof Description>) => (
  <Description
    ref={ref}
    className={cn('text-[12px] text-foreground-muted', className)}
    {...props}
  />
);

const AlertDialogAction = ({ className, ref, ...props }: ComponentProps<typeof Action>) => (
  <Action
    ref={ref}
    className={cn(
      'inline-flex h-8 items-center justify-center rounded-md px-3',
      'text-[12px] font-medium transition-colors duration-80',
      'bg-primary text-primary-foreground hover:bg-primary/90',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
      'disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    {...props}
  />
);

const AlertDialogCancel = ({ className, ref, ...props }: ComponentProps<typeof Cancel>) => (
  <Cancel
    ref={ref}
    className={cn(
      'inline-flex h-8 items-center justify-center rounded-md px-3',
      'text-[12px] font-medium transition-colors duration-80',
      'border border-border bg-transparent text-foreground-secondary hover:bg-primary/10 hover:text-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
      'disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    {...props}
  />
);

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};

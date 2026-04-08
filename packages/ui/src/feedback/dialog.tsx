import { ComponentProps, HTMLAttributes } from 'react';

import { Close, Content, Description,Overlay, Portal, Root, Title, Trigger } from '@radix-ui/react-dialog';

import { cn } from '../lib/utils';

const Dialog = Root;
const DialogTrigger = Trigger;
const DialogPortal = Portal;
const DialogClose = Close;

function DialogOverlay({ className, ref, ...props }: ComponentProps<typeof Overlay>) {
  return (
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
}

function DialogContent({ className, children, ref, ...props }: ComponentProps<typeof Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <Content
        ref={ref}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          'w-full max-w-md',
          'bg-card border border-border rounded-lg shadow-lg',
          'p-6',
          'animate-in fade-in-0 zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          className,
        )}
        {...props}
      >
        {children}
      </Content>
    </DialogPortal>
  );
}

const DialogHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1.5 mb-4', className)} {...props} />
);

const DialogFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex justify-end gap-2 mt-4', className)} {...props} />
);

function DialogTitle({ className, ref, ...props }: ComponentProps<typeof Title>) {
  return (
    <Title
      ref={ref}
      className={cn('text-[13px] font-semibold text-foreground', className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ref, ...props }: ComponentProps<typeof Description>) {
  return (
    <Description
      ref={ref}
      className={cn('text-[12px] text-foreground-muted', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};

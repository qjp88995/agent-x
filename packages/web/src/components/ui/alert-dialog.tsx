import * as React from 'react';

import { AlertTriangle, Info } from 'lucide-react';
import { AlertDialog as AlertDialogPrimitive } from 'radix-ui';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AlertDialogVariant = 'default' | 'destructive';

const AlertDialogVariantContext =
  React.createContext<AlertDialogVariant>('default');

function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  );
}

function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  );
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  );
}

const variantConfig = {
  default: {
    bar: 'from-[oklch(0.541_0.25_293)] to-[oklch(0.715_0.143_215)]',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    icon: Info,
  },
  destructive: {
    bar: 'from-[oklch(0.577_0.245_27)] to-[oklch(0.65_0.2_40)]',
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    icon: AlertTriangle,
  },
};

function AlertDialogContent({
  className,
  size = 'default',
  variant = 'default',
  icon: IconOverride,
  children,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content> & {
  size?: 'default' | 'sm';
  variant?: AlertDialogVariant;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const config = variantConfig[variant];
  const IconComponent = IconOverride ?? config.icon;

  return (
    <AlertDialogVariantContext.Provider value={variant}>
      <AlertDialogPortal>
        <AlertDialogOverlay />
        <AlertDialogPrimitive.Content
          data-slot="alert-dialog-content"
          data-size={size}
          className={cn(
            'group/alert-dialog-content fixed top-[40%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-lg border bg-background shadow-lg duration-200 data-[size=sm]:max-w-xs data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[size=default]:sm:max-w-lg',
            className
          )}
          {...props}
        >
          <div
            className={cn(
              'alert-bar-animate h-[3px] w-full bg-gradient-to-r',
              config.bar
            )}
          />
          <div className="grid gap-4 p-6">
            <div className="flex gap-4">
              <div
                className={cn(
                  'alert-icon-animate flex size-10 shrink-0 items-center justify-center rounded-full',
                  config.iconBg
                )}
              >
                <IconComponent className={cn('size-5', config.iconColor)} />
              </div>
              <div className="grid flex-1 gap-4">{children}</div>
            </div>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPortal>
    </AlertDialogVariantContext.Provider>
  );
}

function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn('grid gap-1.5', className)}
      {...props}
    />
  );
}

function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end',
        className
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn('text-lg font-semibold', className)}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function AlertDialogMedia({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        "mb-2 inline-flex size-16 items-center justify-center rounded-md bg-muted sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*='size-'])]:size-8",
        className
      )}
      {...props}
    />
  );
}

function AlertDialogAction({
  className,
  variant,
  size = 'default',
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action> &
  Pick<React.ComponentProps<typeof Button>, 'variant' | 'size'>) {
  const contextVariant = React.useContext(AlertDialogVariantContext);
  const buttonVariant =
    variant ?? (contextVariant === 'destructive' ? 'destructive' : 'default');

  return (
    <Button variant={buttonVariant} size={size} asChild>
      <AlertDialogPrimitive.Action
        data-slot="alert-dialog-action"
        className={cn(className)}
        {...props}
      />
    </Button>
  );
}

function AlertDialogCancel({
  className,
  variant = 'outline',
  size = 'default',
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel> &
  Pick<React.ComponentProps<typeof Button>, 'variant' | 'size'>) {
  return (
    <Button variant={variant} size={size} asChild>
      <AlertDialogPrimitive.Cancel
        data-slot="alert-dialog-cancel"
        className={cn(className)}
        {...props}
      />
    </Button>
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};

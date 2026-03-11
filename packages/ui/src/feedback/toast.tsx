import { Toaster as SonnerToaster } from 'sonner';
import { cn } from '../lib/utils';

function Toaster({
  className,
  ...props
}: React.ComponentProps<typeof SonnerToaster>) {
  return (
    <SonnerToaster
      position="top-right"
      visibleToasts={3}
      duration={3000}
      className={cn(className)}
      toastOptions={{
        classNames: {
          toast:
            'group border border-border bg-card text-foreground-secondary rounded-[var(--radius-md)] shadow-lg !text-[12px]',
          title: 'text-foreground-secondary !text-[12px] !font-medium',
          description: 'text-foreground-muted !text-[11px]',
          actionButton:
            'bg-primary text-primary-foreground !text-[11px] !font-medium',
          cancelButton:
            'bg-card text-foreground-muted !text-[11px] !font-medium',
          success: 'border-l-2 !border-l-[#10b981]',
          error: 'border-l-2 !border-l-[#ef4444]',
          warning: 'border-l-2 !border-l-[#f59e0b]',
          info: 'border-l-2 !border-l-[#3b82f6]',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
export { toast } from 'sonner';

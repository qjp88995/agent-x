import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            'group-[.toaster]:!bg-background group-[.toaster]:!text-foreground group-[.toaster]:!border-border group-[.toaster]:!shadow-lg group-[.toaster]:rounded-lg',
          title: 'group-[.toaster]:text-sm group-[.toaster]:font-semibold',
          description:
            'group-[.toaster]:!text-muted-foreground group-[.toaster]:text-xs',
          actionButton:
            'group-[.toaster]:!bg-primary group-[.toaster]:!text-primary-foreground',
          cancelButton:
            'group-[.toaster]:!bg-muted group-[.toaster]:!text-muted-foreground',
        },
      }}
      {...props}
    />
  );
}

export { Toaster };

import { ComponentProps } from 'react';

import { Content,Portal, Provider, Root, Trigger } from '@radix-ui/react-tooltip';

import { cn } from '../lib/utils';

const TooltipProvider = Provider;
const Tooltip = Root;
const TooltipTrigger = Trigger;

function TooltipContent({
  className,
  sideOffset = 4,
  ref,
  ...props
}: ComponentProps<typeof Content>) {
  return (
    <Portal>
      <Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'z-50 overflow-hidden rounded-sm border border-border bg-card px-2 py-1',
          'text-xs text-foreground-muted',
          'animate-in fade-in-0 zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1',
          'data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1',
          className,
        )}
        {...props}
      />
    </Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };

import { type ComponentProps } from 'react';

import {
  Corner,
  Root,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  Viewport,
} from '@radix-ui/react-scroll-area';

import { cn } from '../lib/utils';

function ScrollArea({
  className,
  children,
  ref,
  ...props
}: ComponentProps<typeof Root>) {
  return (
    <Root
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      <Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </Viewport>
      <ScrollBar />
      <ScrollBar orientation="horizontal" />
      <Corner />
    </Root>
  );
}

function ScrollBar({
  className,
  orientation = 'vertical',
  ref,
  ...props
}: ComponentProps<typeof ScrollAreaScrollbar>) {
  return (
    <ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      className={cn(
        'flex touch-none select-none transition-colors duration-150',
        orientation === 'vertical' &&
          'h-full w-1.5 border-l border-l-transparent p-px',
        orientation === 'horizontal' &&
          'h-1.5 flex-col border-t border-t-transparent p-px',
        className
      )}
      {...props}
    >
      <ScrollAreaThumb
        className={cn(
          'relative flex-1 rounded-full bg-border',
          'hover:bg-foreground-ghost',
          'transition-colors duration-150'
        )}
      />
    </ScrollAreaScrollbar>
  );
}

export { ScrollArea, ScrollBar };

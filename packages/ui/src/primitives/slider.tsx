import { type ComponentProps } from 'react';
import { Root, Track, Range, Thumb } from '@radix-ui/react-slider';
import { cn } from '../lib/utils';

function Slider({ className, ref, ...props }: ComponentProps<typeof Root>) {
  return (
    <Root
      ref={ref}
      className={cn(
        'relative flex w-full touch-none select-none items-center',
        className
      )}
      {...props}
    >
      <Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-border">
        <Range className="absolute h-full bg-primary" />
      </Track>
      <Thumb
        className={cn(
          'block h-4 w-4 rounded-full bg-primary border-2 border-white shadow-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:pointer-events-none disabled:opacity-50',
          'transition-colors duration-120'
        )}
      />
    </Root>
  );
}

export { Slider };

import { type ComponentProps } from 'react';
import { Root, Thumb } from '@radix-ui/react-switch';
import { cn } from '../lib/utils';

function Switch({ className, ref, ...props }: ComponentProps<typeof Root>) {
  return (
    <Root
      ref={ref}
      className={cn(
        'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent',
        'bg-border transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-primary',
        className
      )}
      {...props}
    >
      <Thumb
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm',
          'transition-transform duration-200',
          'data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0'
        )}
      />
    </Root>
  );
}

export { Switch };

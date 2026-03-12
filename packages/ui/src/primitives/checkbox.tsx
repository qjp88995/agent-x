import { type ComponentProps } from 'react';

import { Indicator,Root } from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '../lib/utils';

function Checkbox({ className, ref, ...props }: ComponentProps<typeof Root>) {
  return (
    <Root
      ref={ref}
      className={cn(
        'peer h-4 w-4 shrink-0 rounded-sm border border-border bg-transparent',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[state=checked]:bg-primary data-[state=checked]:border-primary',
        'transition-colors duration-120',
        className
      )}
      {...props}
    >
      <Indicator className="flex items-center justify-center text-white">
        <Check className="h-3 w-3 stroke-3" />
      </Indicator>
    </Root>
  );
}

export { Checkbox };

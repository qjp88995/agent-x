import { type ComponentProps } from 'react';

import { Root } from '@radix-ui/react-label';

import { cn } from '../lib/utils';

function Label({ className, ref, ...props }: ComponentProps<typeof Root>) {
  return (
    <Root
      ref={ref}
      className={cn(
        'text-[11px] font-medium text-foreground-subtle peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  );
}

export { Label };

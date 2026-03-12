import { type ComponentProps } from 'react';

import { Root } from '@radix-ui/react-separator';

import { cn } from '../lib/utils';

function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ref,
  ...props
}: ComponentProps<typeof Root>) {
  return (
    <Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
      {...props}
    />
  );
}

export { Separator };

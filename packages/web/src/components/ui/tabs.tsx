import * as React from 'react';

import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-6', className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'text-muted-foreground inline-flex h-10 w-fit items-center gap-1 border-b border-border',
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        'relative inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
        'text-muted-foreground hover:text-foreground',
        'focus-visible:outline-ring focus-visible:outline-1 focus-visible:ring-ring/50 focus-visible:ring-0.75',
        'disabled:pointer-events-none disabled:opacity-50',
        'data-[state=active]:text-foreground',
        'after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-full',
        'after:bg-linear-to-r after:from-[oklch(0.541_0.25_293)] after:to-[oklch(0.715_0.143_215)]',
        'after:opacity-0 data-[state=active]:after:opacity-100 after:transition-opacity after:duration-200',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };

import { ComponentProps } from 'react';

import {
  CheckboxItem,
  Content,
  Group,
  Item,
  ItemIndicator,
  Label,
  Portal,
  RadioGroup,
  RadioItem,
  Root,
  Separator,
  Sub,
  SubContent,
  SubTrigger,
  Trigger,
} from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';

import { cn } from '../lib/utils';

const DropdownMenu = Root;
const DropdownMenuTrigger = Trigger;
const DropdownMenuGroup = Group;
const DropdownMenuPortal = Portal;
const DropdownMenuSub = Sub;
const DropdownMenuRadioGroup = RadioGroup;

const DropdownMenuContent = ({ className, sideOffset = 4, ref, ...props }: ComponentProps<typeof Content>) => (
  <Portal>
    <Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-32 overflow-hidden rounded-md border border-border bg-card p-1 shadow-md',
        'animate-in fade-in-0 zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  </Portal>
);

interface DropdownMenuItemProps extends ComponentProps<typeof Item> {
  inset?: boolean;
  variant?: 'default' | 'destructive';
}

const DropdownMenuItem = ({ className, inset, variant = 'default', ref, ...props }: DropdownMenuItemProps) => (
  <Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5',
      'text-[12px] text-foreground-secondary outline-none transition-colors duration-80',
      'focus:bg-primary/10 focus:text-foreground',
      'data-disabled:pointer-events-none data-disabled:opacity-50',
      '**:[svg]:size-3.5 **:[svg]:shrink-0 **:[svg]:text-foreground-ghost',
      inset && 'pl-8',
      variant === 'destructive' &&
        'text-destructive focus:bg-destructive/10 focus:text-destructive **:[svg]:text-destructive',
      className
    )}
    {...props}
  />
);

const DropdownMenuCheckboxItem = ({ className, children, checked, ref, ...props }: ComponentProps<typeof CheckboxItem>) => (
  <CheckboxItem
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2',
      'text-[12px] text-foreground-secondary outline-none transition-colors duration-80',
      'focus:bg-primary/10 focus:text-foreground',
      'data-disabled:pointer-events-none data-disabled:opacity-50',
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ItemIndicator>
        <Check className="h-3 w-3 stroke-3" />
      </ItemIndicator>
    </span>
    {children}
  </CheckboxItem>
);

const DropdownMenuRadioItem = ({ className, children, ref, ...props }: ComponentProps<typeof RadioItem>) => (
  <RadioItem
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2',
      'text-[12px] text-foreground-secondary outline-none transition-colors duration-80',
      'focus:bg-primary/10 focus:text-foreground',
      'data-disabled:pointer-events-none data-disabled:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </ItemIndicator>
    </span>
    {children}
  </RadioItem>
);

const DropdownMenuLabel = ({ className, inset, ref, ...props }: ComponentProps<typeof Label> & { inset?: boolean }) => (
  <Label
    ref={ref}
    className={cn(
      'px-2 py-1.5 text-[10px] font-medium text-foreground-dim',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
);

const DropdownMenuSeparator = ({ className, ref, ...props }: ComponentProps<typeof Separator>) => (
  <Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-border', className)}
    {...props}
  />
);

const DropdownMenuSubTrigger = ({ className, inset, children, ref, ...props }: ComponentProps<typeof SubTrigger> & { inset?: boolean }) => (
  <SubTrigger
    ref={ref}
    className={cn(
      'flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5',
      'text-[12px] text-foreground-secondary outline-none transition-colors duration-80',
      'focus:bg-primary/10 data-[state=open]:bg-primary/10',
      '**:[svg]:size-3.5 **:[svg]:shrink-0 **:[svg]:text-foreground-ghost',
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto" />
  </SubTrigger>
);

const DropdownMenuSubContent = ({ className, ref, ...props }: ComponentProps<typeof SubContent>) => (
  <SubContent
    ref={ref}
    className={cn(
      'z-50 min-w-32 overflow-hidden rounded-md border border-border bg-card p-1 shadow-md',
      'animate-in fade-in-0 zoom-in-95',
      'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
      'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
      'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
);

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
};

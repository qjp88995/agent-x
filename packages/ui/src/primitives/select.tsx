import { ComponentProps } from 'react';
import {
  Root,
  Group,
  Value,
  Trigger,
  ScrollUpButton,
  ScrollDownButton,
  Content,
  Portal,
  Viewport,
  Label,
  Item,
  ItemIndicator,
  ItemText,
  Separator,
  Icon,
} from '@radix-ui/react-select';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { cn } from '../lib/utils';

const Select = Root;
const SelectGroup = Group;
const SelectValue = Value;

function SelectTrigger({
  className,
  children,
  ref,
  ...props
}: ComponentProps<typeof Trigger>) {
  return (
    <Trigger
      ref={ref}
      className={cn(
        'flex h-8 w-full items-center justify-between gap-2 rounded-md border border-border bg-card px-3 text-[13px] text-foreground-secondary',
        'focus:outline-none focus:border-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-placeholder:text-foreground-ghost',
        'transition-colors duration-(--duration-fast)',
        '[&>span]:line-clamp-1 [&>span]:text-left',
        className
      )}
      {...props}
    >
      {children}
      <Icon asChild>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-foreground-ghost" />
      </Icon>
    </Trigger>
  );
}

function SelectScrollUpButton({
  className,
  ref,
  ...props
}: ComponentProps<typeof ScrollUpButton>) {
  return (
    <ScrollUpButton
      ref={ref}
      className={cn(
        'flex cursor-default items-center justify-center py-1',
        className
      )}
      {...props}
    >
      <ChevronUp className="h-3.5 w-3.5 text-foreground-ghost" />
    </ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ref,
  ...props
}: ComponentProps<typeof ScrollDownButton>) {
  return (
    <ScrollDownButton
      ref={ref}
      className={cn(
        'flex cursor-default items-center justify-center py-1',
        className
      )}
      {...props}
    >
      <ChevronDown className="h-3.5 w-3.5 text-foreground-ghost" />
    </ScrollDownButton>
  );
}

function SelectContent({
  className,
  children,
  position = 'popper',
  ref,
  ...props
}: ComponentProps<typeof Content>) {
  return (
    <Portal>
      <Content
        ref={ref}
        className={cn(
          'relative z-50 min-w-32 overflow-hidden rounded-md border border-border bg-card shadow-lg',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width)'
          )}
        >
          {children}
        </Viewport>
        <SelectScrollDownButton />
      </Content>
    </Portal>
  );
}

function SelectLabel({
  className,
  ref,
  ...props
}: ComponentProps<typeof Label>) {
  return (
    <Label
      ref={ref}
      className={cn(
        'px-2 py-1.5 text-[11px] font-medium text-foreground-ghost uppercase tracking-wider',
        className
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ref,
  ...props
}: ComponentProps<typeof Item>) {
  return (
    <Item
      ref={ref}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-7 pr-2 text-[12px] text-foreground-secondary outline-none',
        'focus:bg-primary/10 focus:text-foreground-secondary',
        'hover:bg-primary/10',
        'data-disabled:pointer-events-none data-disabled:opacity-50',
        'transition-colors duration-80',
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <ItemIndicator>
          <Check className="h-3 w-3 text-primary stroke-3" />
        </ItemIndicator>
      </span>
      <ItemText>{children}</ItemText>
    </Item>
  );
}

function SelectSeparator({
  className,
  ref,
  ...props
}: ComponentProps<typeof Separator>) {
  return (
    <Separator
      ref={ref}
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};

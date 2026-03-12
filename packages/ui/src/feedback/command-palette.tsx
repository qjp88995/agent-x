import {
  useState,
  useEffect,
  type ComponentProps,
  type HTMLAttributes,
} from 'react';
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
  CommandSeparator,
} from 'cmdk';
import { Search } from 'lucide-react';
import { cn } from '../lib/utils';

// ── Root ────────────────────────────────────────────────────────────────────

type CommandPaletteProps = ComponentProps<typeof CommandDialog> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const CommandPalette = ({
  className,
  children,
  open,
  onOpenChange,
  ref,
  ...props
}: CommandPaletteProps) => (
  <CommandDialog
    ref={ref}
    open={open}
    onOpenChange={onOpenChange}
    overlayClassName="fixed inset-0 z-50 bg-black/60 animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
    contentClassName={cn(
      'fixed top-[20%] left-1/2 z-50 -translate-x-1/2',
      'w-120 max-w-[calc(100%-2rem)]',
      'bg-card border border-border rounded-lg shadow-lg overflow-hidden',
      'animate-in fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
      '**:[[cmdk-root]]:flex **:[[cmdk-root]]:flex-col',
      className
    )}
    loop
    {...props}
  >
    {children}
  </CommandDialog>
);

// ── Input ───────────────────────────────────────────────────────────────────

type CommandPaletteInputProps = ComponentProps<typeof CommandInput>;

const CommandPaletteInput = ({
  className,
  ref,
  ...props
}: CommandPaletteInputProps) => (
  <div className="flex items-center gap-2 px-3 border-b border-border">
    <Search className="size-3.5 shrink-0 text-foreground-ghost" aria-hidden />
    <CommandInput
      ref={ref}
      className={cn(
        'flex-1 bg-transparent border-0 outline-none ring-0',
        'h-10 py-0',
        'text-[13px] text-foreground-secondary placeholder:text-foreground-ghost',
        'focus:outline-none focus:ring-0',
        className
      )}
      {...props}
    />
  </div>
);

// ── List ────────────────────────────────────────────────────────────────────

type CommandPaletteListProps = ComponentProps<typeof CommandList>;

const CommandPaletteList = ({
  className,
  ref,
  ...props
}: CommandPaletteListProps) => (
  <CommandList
    ref={ref}
    className={cn('max-h-75 overflow-y-auto p-1', className)}
    {...props}
  />
);

// ── Group ───────────────────────────────────────────────────────────────────

type CommandPaletteGroupProps = ComponentProps<typeof CommandGroup>;

const CommandPaletteGroup = ({
  className,
  ref,
  ...props
}: CommandPaletteGroupProps) => (
  <CommandGroup
    ref={ref}
    className={cn(
      '**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5',
      '**:[[cmdk-group-heading]]:text-[10px] **:[[cmdk-group-heading]]:font-medium',
      '**:[[cmdk-group-heading]]:text-foreground-dim **:[[cmdk-group-heading]]:uppercase',
      '**:[[cmdk-group-heading]]:tracking-wide',
      className
    )}
    {...props}
  />
);

// ── Item ────────────────────────────────────────────────────────────────────

type CommandPaletteItemProps = ComponentProps<typeof CommandItem>;

const CommandPaletteItem = ({
  className,
  ref,
  ...props
}: CommandPaletteItemProps) => (
  <CommandItem
    ref={ref}
    className={cn(
      'flex items-center px-2 py-1.5 mx-1',
      'rounded-sm',
      'text-[12px] text-foreground-secondary',
      'cursor-pointer select-none outline-none',
      'transition-colors duration-75',
      'data-[selected=true]:bg-primary-muted data-[selected=true]:text-foreground',
      'aria-selected:bg-primary-muted aria-selected:text-foreground',
      className
    )}
    {...props}
  />
);

// ── Empty ───────────────────────────────────────────────────────────────────

type CommandPaletteEmptyProps = ComponentProps<typeof CommandEmpty>;

const CommandPaletteEmpty = ({
  className,
  ref,
  ...props
}: CommandPaletteEmptyProps) => (
  <CommandEmpty
    ref={ref}
    className={cn(
      'py-8 text-center text-[12px] text-foreground-ghost',
      className
    )}
    {...props}
  />
);

// ── Separator ───────────────────────────────────────────────────────────────

type CommandPaletteSeparatorProps = ComponentProps<typeof CommandSeparator>;

const CommandPaletteSeparator = ({
  className,
  ref,
  ...props
}: CommandPaletteSeparatorProps) => (
  <CommandSeparator
    ref={ref}
    className={cn('h-px bg-border my-1', className)}
    {...props}
  />
);

// ── Kbd hint ─────────────────────────────────────────────────────────────────

type KbdProps = HTMLAttributes<HTMLElement>;

const Kbd = ({ className, ...props }: KbdProps) => (
  <kbd
    className={cn(
      'ml-auto text-[10px] text-foreground-ghost',
      'bg-background border border-border',
      'px-1 rounded',
      'font-sans',
      className
    )}
    {...props}
  />
);

// ── Item icon wrapper ─────────────────────────────────────────────────────────

type CommandPaletteItemIconProps = HTMLAttributes<HTMLSpanElement>;

const CommandPaletteItemIcon = ({
  className,
  ...props
}: CommandPaletteItemIconProps) => (
  <span
    className={cn(
      'mr-2 size-3.5 text-foreground-ghost flex items-center justify-center',
      className
    )}
    aria-hidden
    {...props}
  />
);

// ── Hook: useCommandPalette ───────────────────────────────────────────────────

function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  return { open, setOpen };
}

export {
  CommandPalette,
  CommandPaletteInput,
  CommandPaletteList,
  CommandPaletteGroup,
  CommandPaletteItem,
  CommandPaletteEmpty,
  CommandPaletteSeparator,
  CommandPaletteItemIcon,
  Kbd,
  useCommandPalette,
  // Re-export cmdk primitives for advanced composition
  Command as CommandPaletteRoot,
};

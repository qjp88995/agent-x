import * as React from 'react';
import {
  Command,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from 'cmdk';
import { cn } from '../lib/utils';

type SlashCommand = {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  group?: string;
};

type SlashCommandMenuProps = {
  commands: SlashCommand[];
  open: boolean;
  onSelect: (command: SlashCommand) => void;
  onOpenChange: (open: boolean) => void;
  search?: string;
  onSearchChange?: (search: string) => void;
  className?: string;
};

function SlashCommandMenu({
  commands,
  open,
  onSelect,
  onOpenChange,
  search = '',
  onSearchChange,
  className,
}: SlashCommandMenuProps) {
  // Group commands by their `group` field
  const grouped = React.useMemo(() => {
    const map = new Map<string, SlashCommand[]>();
    for (const cmd of commands) {
      const key = cmd.group ?? '';
      const existing = map.get(key);
      if (existing) {
        existing.push(cmd);
      } else {
        map.set(key, [cmd]);
      }
    }
    return map;
  }, [commands]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className={cn(
        'absolute bottom-full mb-1 left-0 right-0 z-50',
        'bg-card border border-border rounded-[var(--radius-md)] shadow-lg overflow-hidden',
        'animate-in fade-in-0 slide-in-from-bottom-2 duration-150',
        className,
      )}
    >
      <Command
        shouldFilter={true}
        filter={(value, search) => {
          if (!search) return 1;
          const lower = value.toLowerCase();
          const s = search.toLowerCase();
          return lower.includes(s) ? 1 : 0;
        }}
      >
        {/* Hidden input — search is controlled externally */}
        <div className="hidden">
          <input
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            readOnly={!onSearchChange}
          />
        </div>

        <CommandList className="max-h-[240px] overflow-y-auto p-1">
          <CommandEmpty className="py-6 text-center text-[12px] text-foreground-ghost">
            No commands found
          </CommandEmpty>

          {Array.from(grouped.entries()).map(([group, items]) => (
            <CommandGroup
              key={group || '__ungrouped__'}
              heading={group || undefined}
              className={cn(
                group &&
                  '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-foreground-dim [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide',
              )}
            >
              {items.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  value={`${cmd.label} ${cmd.description ?? ''}`}
                  onSelect={() => {
                    onSelect(cmd);
                    onOpenChange(false);
                  }}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 mx-0.5',
                    'rounded-[var(--radius-sm)]',
                    'text-[12px] text-foreground-secondary',
                    'cursor-pointer select-none outline-none',
                    'transition-colors duration-75',
                    'data-[selected=true]:bg-primary-muted data-[selected=true]:text-foreground',
                    'aria-selected:bg-primary-muted aria-selected:text-foreground',
                  )}
                >
                  {cmd.icon && (
                    <span className="size-4 shrink-0 flex items-center justify-center text-foreground-ghost">
                      {cmd.icon}
                    </span>
                  )}
                  <span className="font-medium">{cmd.label}</span>
                  {cmd.description && (
                    <span className="ml-1 text-foreground-ghost truncate">{cmd.description}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </div>
  );
}

export { SlashCommandMenu, type SlashCommand };

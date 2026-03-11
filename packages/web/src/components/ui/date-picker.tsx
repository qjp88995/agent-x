import { useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@agent-x/design';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import { useDateLocale } from '@/hooks/use-date-locale';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  readonly value?: Date;
  readonly onChange: (date: Date | undefined) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly fromDate?: Date;
  readonly clearable?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  disabled,
  fromDate,
  clearable,
}: DatePickerProps) {
  const locale = useDateLocale();
  const [open, setOpen] = useState(false);

  function handleSelect(date: Date | undefined) {
    onChange(date);
    if (date) setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50',
              !value && 'text-muted-foreground',
              clearable && value && 'pr-8'
            )}
          >
            <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {value ? format(value, 'PPP', { locale }) : placeholder}
            </span>
          </button>
        </PopoverTrigger>
        {clearable && value && !disabled && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute right-2 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          locale={locale}
          disabled={fromDate ? { before: fromDate } : undefined}
          defaultMonth={value}
        />
      </PopoverContent>
    </Popover>
  );
}

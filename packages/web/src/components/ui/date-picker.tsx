import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDateLocale } from '@/hooks/use-date-locale';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  readonly value?: Date;
  readonly onChange: (date: Date | undefined) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly fromDate?: Date;
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  disabled,
  fromDate,
}: DatePickerProps) {
  const locale = useDateLocale();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 size-4" />
          {value ? format(value, 'PPP', { locale }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          locale={locale}
          disabled={fromDate ? { before: fromDate } : undefined}
          defaultMonth={value}
        />
      </PopoverContent>
    </Popover>
  );
}

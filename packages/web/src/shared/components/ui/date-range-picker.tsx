'use client';

import * as React from 'react';
import { CalendarDays } from 'lucide-react';
import { type DateRange as DayPickerRange } from 'react-day-picker';

import { Button } from '@/shared/components/ui/button';
import { Calendar } from '@/shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { cn } from '@/shared/lib/cn';
import { formatDateLabel, parseDateInput, toDateInput } from '@/shared/lib/date';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
  active?: boolean;
}

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  active = false,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selected: DayPickerRange = React.useMemo(
    () => ({ from: parseDateInput(startDate), to: parseDateInput(endDate) }),
    [startDate, endDate],
  );

  const handleSelect = (range: DayPickerRange | undefined) => {
    if (!range?.from || !range.to) {
      return;
    }
    onChange({ startDate: toDateInput(range.from), endDate: toDateInput(range.to) });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          className={cn(
            'w-52 justify-start font-normal',
            active && 'border-white/10 bg-neutral-800',
          )}
        >
          <CalendarDays className="text-neutral-500" aria-hidden="true" />
          <span className="truncate text-sm">
            {formatDateLabel(selected.from ?? new Date())} —{' '}
            {formatDateLabel(selected.to ?? new Date())}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-0">
        <Calendar
          mode="range"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={selected.from}
          disabled={{ after: new Date() }}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}

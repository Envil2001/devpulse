'use client';

import * as React from 'react';
import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export type CalendarProps = DayPickerProps;

function Calendar({ className, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('w-fit', className)}
      classNames={{
        months: 'flex flex-row gap-4',
        month: 'flex flex-col gap-3',
        month_caption: 'relative flex h-8 w-full items-center justify-center px-8',
        caption_label: 'text-sm font-medium text-foreground',
        nav: 'absolute inset-x-0 top-0 z-10 flex h-8 items-center justify-between px-1',
        button_previous: cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-[10px]',
          'text-subtle transition-colors hover:bg-gray-alpha-100 hover:text-foreground',
        ),
        button_next: cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-[10px]',
          'text-subtle transition-colors hover:bg-gray-alpha-100 hover:text-foreground',
        ),
        chevron: 'h-4 w-4',
        weekdays: 'flex',
        weekday: 'w-9 text-center text-xs font-medium text-subtle',
        week: 'mt-1 flex w-full',
        day: 'relative flex h-9 w-9 items-center justify-center p-0 text-center',
        day_button: cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-transparent',
          'text-sm text-secondary transition-colors',
          'hover:bg-gray-alpha-100 hover:text-foreground',
        ),
        range_start: cn(
          'rounded-l-[10px]',
          '[&_button]:bg-brand [&_button]:text-background [&_button]:font-medium',
          '[&_button]:hover:bg-brand',
        ),
        range_end: cn(
          'rounded-r-[10px]',
          '[&_button]:bg-brand [&_button]:text-background [&_button]:font-medium',
          '[&_button]:hover:bg-brand',
        ),
        range_middle: cn(
          'bg-brand/15',
          '[&_button]:bg-transparent [&_button]:text-brand',
          '[&_button]:hover:bg-transparent',
        ),
        today: '[&_button]:font-medium [&_button]:text-brand',
        outside: 'text-subtle/40',
        disabled: 'text-subtle/30',
        hidden: 'invisible',
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
          ) : (
            <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };

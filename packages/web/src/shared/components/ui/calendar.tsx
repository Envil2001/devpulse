'use client';

import * as React from 'react';
import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export type CalendarProps = DayPickerProps;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('w-fit', className)}
      classNames={{
        months: 'flex flex-row gap-4',
        month: 'flex flex-col gap-3',
        month_caption: 'relative flex h-8 w-full items-center justify-center px-8',
        caption_label: 'text-sm font-medium text-neutral-100',
        nav: 'absolute inset-x-0 top-0 z-10 flex h-8 items-center justify-between px-1',
        button_previous: cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-[10px] border border-white/10',
          'text-neutral-400 transition-colors hover:border-white/20 hover:text-neutral-100',
        ),
        button_next: cn(
          'inline-flex h-7 w-7 items-center justify-center rounded-[10px] border border-white/10',
          'text-neutral-400 transition-colors hover:border-white/20 hover:text-neutral-100',
        ),
        chevron: 'h-4 w-4',
        weekdays: 'flex',
        weekday: 'w-9 text-center text-xs font-medium text-neutral-600',
        week: 'mt-1 flex w-full',
        day: 'relative flex h-9 w-9 items-center justify-center p-0 text-center',
        day_button: cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-transparent',
          'text-sm text-neutral-300 transition-colors',
          'hover:bg-white/10 hover:text-neutral-100',
        ),
        range_start: cn(
          'rounded-l-[10px]',
          '[&_button]:bg-green-spring [&_button]:text-neutral-950 [&_button]:font-semibold',
          '[&_button]:hover:bg-green-spring',
        ),
        range_end: cn(
          'rounded-r-[10px]',
          '[&_button]:bg-green-spring [&_button]:text-neutral-950 [&_button]:font-semibold',
          '[&_button]:hover:bg-green-spring',
        ),
        range_middle: cn(
          'bg-green-spring/15',
          '[&_button]:bg-transparent [&_button]:text-green-spring',
          '[&_button]:hover:bg-transparent',
        ),
        today: '[&_button]:font-semibold [&_button]:text-blue-frosty',
        outside: 'text-neutral-700',
        disabled: 'text-neutral-800 opacity-40',
        hidden: 'invisible',
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };

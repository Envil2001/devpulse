import { BadRequestException } from '@nestjs/common';
import { addDays, differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

import { DATE_FORMAT, DATE_PATTERN, MAX_RANGE_DAYS } from '../constants/worklog.constants';

export interface UtcRange {
  startKey: string;
  endKey: string;
  start: Date;
  endExclusive: Date;
}

export function assertDateKey(value: string, label = 'Date'): void {
  if (!DATE_PATTERN.test(value) || !isValid(parseISO(value))) {
    throw new BadRequestException(`${label} must be a valid date in YYYY-MM-DD format.`);
  }
}

export function resolveRange(startDateStr: string, endDateStr: string, timezone: string): UtcRange {
  assertDateKey(startDateStr, 'Start date');
  assertDateKey(endDateStr, 'End date');

  const startDay = parseISO(startDateStr);
  const endDay = parseISO(endDateStr);
  const daysBetween = differenceInCalendarDays(endDay, startDay);

  if (daysBetween < 0) {
    throw new BadRequestException('Start date must not be after end date.');
  }

  if (daysBetween + 1 > MAX_RANGE_DAYS) {
    throw new BadRequestException(`Period must not exceed ${String(MAX_RANGE_DAYS)} days.`);
  }

  const startKey = format(startDay, DATE_FORMAT);
  const endKey = format(endDay, DATE_FORMAT);
  const dayAfterEndKey = format(addDays(endDay, 1), DATE_FORMAT);

  return {
    startKey,
    endKey,
    start: fromZonedTime(`${startKey}T00:00:00`, timezone),
    endExclusive: fromZonedTime(`${dayAfterEndKey}T00:00:00`, timezone),
  };
}

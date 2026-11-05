import { format, isValid, parse } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const DATE_INPUT_FORMAT = 'yyyy-MM-dd';
const DATE_LABEL_FORMAT = 'MMM d, yyyy';
const DATE_TIME_LABEL_FORMAT = 'MMM d, h:mm a';

const timeFormatterByTimezone = new Map<string, Intl.DateTimeFormat>();

function getTimeFormatter(timezone: string): Intl.DateTimeFormat {
  const cached = timeFormatterByTimezone.get(timezone);
  if (cached) return cached;

  const formatter = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
    hour12: false,
  });
  timeFormatterByTimezone.set(timezone, formatter);
  return formatter;
}

export function toDateInput(date: Date): string {
  return format(date, DATE_INPUT_FORMAT);
}

export function parseDateInput(value: string): Date {
  const parsed = parse(value, DATE_INPUT_FORMAT, new Date());
  return isValid(parsed) ? parsed : new Date();
}

export function formatDateLabel(date: Date): string {
  return format(date, DATE_LABEL_FORMAT);
}

export function formatChartAxisLabel(dateInput: string, rangeDays: number): string {
  const date = parseDateInput(dateInput);
  return format(date, rangeDays <= 7 ? 'EEE' : 'MMM d');
}

export function formatDateTimeLabel(isoString: string, timezone: string): string {
  return formatInTimeZone(new Date(isoString), timezone, DATE_TIME_LABEL_FORMAT);
}

export function formatTimeRange(
  startedAt: string,
  endedAt: string | null,
  timezone: string,
): string {
  const formatter = getTimeFormatter(timezone);
  const start = formatter.format(new Date(startedAt));
  const end = endedAt ? formatter.format(new Date(endedAt)) : 'now';

  return `${start} → ${end}`;
}

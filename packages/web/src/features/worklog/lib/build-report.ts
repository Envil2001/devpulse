import { formatDateLabel, parseDateInput } from '@/shared/lib/date';
import type { WorklogPlan } from '@/shared/types';

import type { DayState } from '../hooks';
import { formatDuration } from '@devpulse/lib';

export function buildReportText(plan: WorklogPlan, days: ReadonlyArray<DayState>): string {
  const finished = days.filter((item) => item.status === 'done' && item.result);

  if (plan.startDate === plan.endDate) {
    return finished[0]?.result?.text ?? '';
  }

  const start = formatDateLabel(parseDateInput(plan.startDate));
  const end = formatDateLabel(parseDateInput(plan.endDate));
  const { activeDays, activeMinutes, averageFocusScore } = plan.totals;

  const header = `${start} to ${end}: ${String(activeDays)} active days, ${formatDuration(activeMinutes)}, average Focus Score ${String(averageFocusScore)}`;

  const sections = finished.map(
    (item) => `${item.day.date}\n${item.result?.text ?? ''}`,
  );

  return [header, ...sections].join('\n\n');
}

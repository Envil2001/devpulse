import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AnalyticsRangeParams,
  DashboardStats,
  analyticsService,
  TimeseriesPoint,
  BranchDataPoint,
} from './api';
import { downloadBlob } from '@/shared/lib/download';

export type AnalyticsPeriod = 'today' | '7d' | '30d' | 'custom';

export interface DateRange {
  startDate: string;
  endDate: string;
}

function endOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function periodToDateRange(
  period: AnalyticsPeriod,
  custom?: { startDate: string; endDate: string },
): DateRange {
  if (period === 'custom' && custom?.startDate && custom?.endDate) {
    const startDate = new Date(`${custom.startDate}T00:00:00`);
    const endDate = endOfDay(new Date(`${custom.endDate}T00:00:00`));

    return startDate <= endDate
      ? { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
      : { startDate: endDate.toISOString(), endDate: startDate.toISOString() };
  }
  const now = new Date();
  const start = new Date(now);

  if (period === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (period === '30d') {
    start.setDate(start.getDate() - 30);
  } else {
    start.setDate(start.getDate() - 7);
  }

  return { startDate: start.toISOString(), endDate: now.toISOString() };
}

export function useDashboardStats(range: DateRange, projectId?: string) {
  return useQuery<DashboardStats>({
    queryKey: ['analytics', 'dashboard', range.startDate, range.endDate, projectId],
    queryFn: () => analyticsService.getDashboard({ ...range, projectId }),
  });
}

export function useAnalyticsTimeseries(range: DateRange, projectId?: string) {
  return useQuery<Array<TimeseriesPoint>>({
    queryKey: ['analytics', 'timeseries', range.startDate, range.endDate, projectId],
    queryFn: () => analyticsService.getTimeseries({ ...range, projectId }),
  });
}

export function useBranchesDistribution(range: DateRange, projectId?: string) {
  return useQuery<Array<BranchDataPoint>>({
    queryKey: ['analytics', 'branches', range.startDate, range.endDate, projectId],
    queryFn: () => analyticsService.getBranches({ ...range, projectId }),
  });
}

export function useExportSessions() {
  return useMutation({
    mutationFn: (params: AnalyticsRangeParams) => analyticsService.exportSessions(params),
    onSuccess: (blob, params) => {
      const start = params.startDate?.split('T')[0] ?? 'all';
      const end = params.endDate?.split('T')[0] ?? 'now';
      downloadBlob(blob, `devpulse-sessions_${start}_${end}.csv`);
    },
  });
}

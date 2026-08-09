import { useQuery } from '@tanstack/react-query';

import {
  analyticsService,
  type AnalyticsRangeParams,
  type BranchDataPoint,
  type DashboardStats,
  type TimeseriesPoint,
} from '@/lib/analytics.service';

export type AnalyticsPeriod = 'today' | '7d' | '30d' | 'custom';

export function periodToDateRange(period: AnalyticsPeriod): { startDate: string; endDate: string } {
  const now = new Date();
  const endDate = now.toISOString();

  const start = new Date(now);
  if (period === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (period === '30d') {
    start.setDate(start.getDate() - 30);
  } else {
    start.setDate(start.getDate() - 7);
  }

  return { startDate: start.toISOString(), endDate };
}

function withPeriod(
  period: AnalyticsPeriod,
  extra: AnalyticsRangeParams = {},
): AnalyticsRangeParams {
  return { ...periodToDateRange(period), ...extra };
}

export function useDashboardStats(period: AnalyticsPeriod, projectId?: string) {
  return useQuery<DashboardStats>({
    queryKey: ['analytics', 'dashboard', period, projectId],
    queryFn: () => analyticsService.getDashboard(withPeriod(period, { projectId })),
  });
}

export function useAnalyticsTimeseries(period: AnalyticsPeriod, projectId?: string) {
  return useQuery<Array<TimeseriesPoint>>({
    queryKey: ['analytics', 'timeseries', period, projectId],
    queryFn: () => analyticsService.getTimeseries(withPeriod(period, { projectId })),
  });
}

export function useBranchesDistribution(period: AnalyticsPeriod, projectId?: string) {
  return useQuery<Array<BranchDataPoint>>({
    queryKey: ['analytics', 'branches', period, projectId],
    queryFn: () => analyticsService.getBranches(withPeriod(period, { projectId })),
  });
}

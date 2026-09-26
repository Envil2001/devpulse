import { serverGet } from '@/shared/api/server-client';
import type {
  DashboardStats,
  AnalyticsRangeParams,
  TimeseriesPoint,
  BranchDataPoint,
  LanguagesBreakdown,
  LiveStatus,
} from './api';

export const getDashboardStatsServer = (params: AnalyticsRangeParams = {}) =>
  serverGet<DashboardStats>('/analytics/dashboard', { params });

export const getTimeseriesServer = async (params: AnalyticsRangeParams = {}) => {
  const { series } = await serverGet<{ series: Array<TimeseriesPoint> }>('/analytics/timeseries', {
    params,
  });
  return series;
};

export const getBranchesServer = async (params: AnalyticsRangeParams = {}) => {
  const { branches } = await serverGet<{ branches: Array<BranchDataPoint> }>(
    '/analytics/branches',
    { params },
  );
  return branches;
};

export const getLanguagesServer = () => serverGet<LanguagesBreakdown>('/analytics/languages');

export const getLiveStatusServer = () => serverGet<LiveStatus>('/analytics/status');

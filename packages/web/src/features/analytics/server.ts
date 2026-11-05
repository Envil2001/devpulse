import {
  type AiRoiMetrics,
  type DashboardStats,
  type HotFilesAnalytics,
  type PipelineHealth,
} from '@devpulse/lib';

import { serverGet } from '@/shared/api/server-client';
import {
  type BranchDataPoint,
  type CommandsBreakdown,
  type LanguagesBreakdown,
  type LiveStatus,
  type TimeseriesPoint,
} from '@/shared/types';

import { type AnalyticsRangeParams } from './api';

export const getDashboardStatsServer = (
  params: AnalyticsRangeParams = {},
): Promise<DashboardStats> => serverGet<DashboardStats>('/analytics/dashboard', { params });

export const getTimeseriesServer = async (
  params: AnalyticsRangeParams = {},
): Promise<Array<TimeseriesPoint>> => {
  const { series } = await serverGet<{ series: Array<TimeseriesPoint> }>('/analytics/timeseries', {
    params,
  });
  return series;
};

export const getBranchesServer = async (
  params: AnalyticsRangeParams = {},
): Promise<Array<BranchDataPoint>> => {
  const { branches } = await serverGet<{ branches: Array<BranchDataPoint> }>(
    '/analytics/branches',
    { params },
  );
  return branches;
};

export const getLanguagesServer = (): Promise<LanguagesBreakdown> =>
  serverGet<LanguagesBreakdown>('/analytics/languages');

export const getCommandsServer = (params: AnalyticsRangeParams = {}): Promise<CommandsBreakdown> =>
  serverGet<CommandsBreakdown>('/analytics/commands', { params });

export const getHotFilesServer = (params: AnalyticsRangeParams = {}): Promise<HotFilesAnalytics> =>
  serverGet<HotFilesAnalytics>('/analytics/hot-files', { params });

export const getLiveStatusServer = (): Promise<LiveStatus> =>
  serverGet<LiveStatus>('/analytics/status');

export const getAiRoiServer = (params: AnalyticsRangeParams = {}): Promise<AiRoiMetrics> =>
  serverGet<AiRoiMetrics>('/analytics/ai-roi', { params });

export const getPipelineHealthServer = (): Promise<PipelineHealth> =>
  serverGet<PipelineHealth>('/analytics/pipeline-health');

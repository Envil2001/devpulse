import { serverGet } from '@/shared/api/server-client';
import {
  TimeseriesPoint,
  BranchDataPoint,
  CommandsBreakdown,
  LanguagesBreakdown,
  LiveStatus,
} from '@/shared/types';
import { DashboardStats } from '@devpulse/lib';
import { type AiRoiMetrics, type PipelineHealth } from '@devpulse/lib';
import { AnalyticsRangeParams } from './api';

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

export const getCommandsServer = (params: AnalyticsRangeParams = {}) =>
  serverGet<CommandsBreakdown>('/analytics/commands', { params });

export const getLiveStatusServer = () => serverGet<LiveStatus>('/analytics/status');

export const getAiRoiServer = (params: AnalyticsRangeParams = {}) =>
  serverGet<AiRoiMetrics>('/analytics/ai-roi', { params });

export const getPipelineHealthServer = () =>
  serverGet<PipelineHealth>('/analytics/pipeline-health');

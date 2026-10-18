import { QueryParams } from '@/shared/api/api-client';
import { BaseService } from '@/shared/api/base.service';
import type {
  BranchDataPoint,
  CommandsBreakdown,
  DashboardStats,
  LanguagesBreakdown,
  LiveStatus,
  TimeseriesPoint,
} from '@/shared/types';

export interface AnalyticsRangeParams extends QueryParams {
  startDate?: string;
  endDate?: string;
  projectId?: string;
}

export class AnalyticsService extends BaseService {
  async getDashboard(params: AnalyticsRangeParams = {}): Promise<DashboardStats> {
    return this.get<DashboardStats>('/analytics/dashboard', { params });
  }

  async getTimeseries(params: AnalyticsRangeParams = {}): Promise<Array<TimeseriesPoint>> {
    const { series } = await this.get<{ series: Array<TimeseriesPoint> }>('/analytics/timeseries', {
      params,
    });
    return series;
  }

  async getBranches(params: AnalyticsRangeParams = {}): Promise<Array<BranchDataPoint>> {
    const { branches } = await this.get<{ branches: Array<BranchDataPoint> }>(
      '/analytics/branches',
      { params },
    );
    return branches;
  }

  async exportSessions(params: AnalyticsRangeParams = {}): Promise<Blob> {
    return this.getBlob('/analytics/export', { params });
  }

  async getLiveStatus(): Promise<LiveStatus> {
    return this.get<LiveStatus>('/analytics/status');
  }

  async getLanguages(params: AnalyticsRangeParams = {}): Promise<LanguagesBreakdown> {
    return this.get<LanguagesBreakdown>('/analytics/languages', { params });
  }

  async getCommands(params: AnalyticsRangeParams = {}): Promise<CommandsBreakdown> {
    return this.get<CommandsBreakdown>('/analytics/commands', { params });
  }
}

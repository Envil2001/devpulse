import { QueryParams } from '@/shared/api/api-client';
import { BaseService } from '@/shared/api/base.service';

export interface DashboardStats {
  totalActiveSeconds: number;
  totalEarnedMoney: number;
  averageFocusScore: number;
  totalSessionsCount: number;
  topLanguage: string | null;
}

export interface TimeseriesPoint {
  date: string;
  activeSeconds: number;
  earnedMoney: number;
}

export interface BranchDataPoint {
  branchName: string;
  activeSeconds: number;
}

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
}

export const analyticsService = new AnalyticsService();

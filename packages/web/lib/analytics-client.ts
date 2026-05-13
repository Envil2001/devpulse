import { getJson } from './api-client';

export interface DashboardSummaryDto {
  from: string;
  to: string;
  sessionCount: number;
  totalActiveMs: number;
  totalTrackedMs: number;
  totalHours: number;
  focusScore: number;
}

export async function getDashboardSummary(authToken: string): Promise<DashboardSummaryDto> {
  return getJson<DashboardSummaryDto>('/analytics/dashboard', { authToken });
}

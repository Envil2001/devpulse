export interface GetAnalyticsDashboardResponseDto {
  from: string;
  to: string;
  sessionCount: number;
  totalActiveMs: number;
  totalTrackedMs: number;
  totalHours: number;
  focusScore: number;
}

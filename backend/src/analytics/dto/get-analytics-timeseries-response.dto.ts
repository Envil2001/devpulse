export interface AnalyticsTimeseriesItemResponseDto {
  day: string;
  sessionCount: number;
  totalActiveMs: number;
  totalTrackedMs: number;
  totalHours: number;
  focusScore: number;
}

export interface GetAnalyticsTimeseriesResponseDto {
  from: string;
  to: string;
  items: Array<AnalyticsTimeseriesItemResponseDto>;
}

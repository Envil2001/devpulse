export interface AnalyticsBranchItemResponseDto {
  gitBranch: string;
  sessionCount: number;
  totalActiveMs: number;
  totalTrackedMs: number;
  totalHours: number;
  focusScore: number;
}

export interface GetAnalyticsBranchesResponseDto {
  from: string;
  to: string;
  branches: Array<AnalyticsBranchItemResponseDto>;
}

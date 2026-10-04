export interface DashboardStatsRaw {
  totalActiveSeconds: string | null;
  totalEarnedMoney: string | null;
  averageFocusScore: string | null;
  totalSessionsCount: string | null;
}

export interface TopLanguageRaw {
  language: string | null;
  totalTime: string | null;
}

export interface TimeseriesRaw {
  date: string;
  activeSeconds: string | null;
  earnedMoney: string | null;
}

export interface BranchDistributionRaw {
  branchName: string | null;
  activeSeconds: string | null;
}

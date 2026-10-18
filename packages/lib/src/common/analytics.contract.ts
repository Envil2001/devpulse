export interface DashboardStats {
  totalActiveSeconds: number;
  totalEarnedMoney: number;
  averageFocusScore: number;
  totalSessionsCount: number;
  topLanguage: string | null;
}

export interface IntegrationTodayStats {
  date: string;
  timezone: string;
  currency: string;
  totalActiveSeconds: number;
  formattedTime: string;
  totalEarnedMoney: number;
  averageFocusScore: number;
  sessionsCount: number;
}

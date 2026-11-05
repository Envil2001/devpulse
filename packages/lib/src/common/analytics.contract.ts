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

export interface AiRoiMetrics {
  aiSessionsCount: number;
  manualSessionsCount: number;
  totalAiInteractions: number;
  aiVelocityLinesPerHour: number;
  manualVelocityLinesPerHour: number;
  speedupPercentage: number;
  estimatedHoursSaved: number;
}

export interface PipelineHealth {
  telemetryBridge: {
    status: 'operational' | 'idle';
    lastEventAt: string | null;
    minutesSinceLastEvent: number | null;
  };
  bullmq: {
    waiting: number;
    active: number;
    failed: number;
    status: 'operational' | 'degraded';
  };
  postgres: {
    latencyMs: number;
    status: 'operational' | 'degraded';
  };
  llm: {
    status: 'operational' | 'unconfigured';
    provider: 'openrouter' | 'openai' | 'custom' | null;
    model: string | null;
  };
}

export interface HotPathMetric {
  path: string;
  activeSeconds: number;
  percentage: number;
}

export interface HotFilesAnalytics {
  /** Time that could be attributed to an active editor file. */
  totalAttributedSeconds: number;
  files: Array<HotPathMetric>;
  folders: Array<HotPathMetric>;
}

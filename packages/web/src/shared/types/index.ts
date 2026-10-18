export interface User {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
  hourlyRate: number;
  currency: string;
  hasOpenaiKey: boolean;
}

export interface ProjectSummary {
  id: string;
  name: string;
  remote: string | null;
  activeTime: string;
  focusScore: number;
  sessions: number;
  lastActive: string | null;
}

export interface WorkSessionSummary {
  id: string;
  startedAt: string;
  endedAt: string;
  projectName: string;
  gitBranch: string | null;
  durationMs: number;
  focusScore: number;
  earnedMoney: number;
  primaryLanguage: string | null;
  status: 'active' | 'closed';
}

export interface WorkSessionDetail {
  id: string;
  projectName: string | null;
  gitBranch: string | null;
  startedAt: string;
  endedAt: string | null;
  activeSeconds: number;
  idleSeconds: number;
  focusScore: number;
  earnedMoney: number;
  primaryLanguage: string | null;
  languageSeconds: Record<string, number>;
  commandsRun: number;
  failedCommands: number;
  terminalCommands: Array<SessionCommand>;
  status: 'active' | 'closed';
}

export interface SessionCommand {
  command: string;
  cwd: string | null;
  exitCode: number | null;
  durationMs: number;
  kind: string;
  timestamp: string;
}

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

export interface LiveStatus {
  isCodingNow: boolean;
  currentProject: string | null;
  currentBranch: string | null;
  currentLanguage: string | null;
  currentSessionDurationSeconds: number | null;
  sessionStartedAt: string | null;
}

export interface LanguageStat {
  language: string;
  activeSeconds: number;
  formattedTime: string;
  percentage: number;
}

export interface LanguagesBreakdown {
  totalActiveSeconds: number;
  languages: Array<LanguageStat>;
}

export interface CommandStat {
  command: string;
  kind: 'test' | 'build' | 'lint' | 'install' | 'git' | 'task' | 'other';
  runs: number;
  failedRuns: number;
  avgDurationMs: number;
  successRate: number;
}

export interface CommandsBreakdown {
  totalCommands: number;
  commands: Array<CommandStat>;
}

export interface ApiKeySummary {
  id: string;
  name: string;
  type: 'extension' | 'integration';
  deviceLabel: string | null;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface CreateApiKeyRequest {
  name: string;
  type: 'extension' | 'integration';
  deviceLabel?: string;
}

export interface CreateApiKeyResponse {
  rawKey: string;
  key: ApiKeySummary;
}

export interface DailyWorklogResponse {
  date: string;
  summary: string;
}

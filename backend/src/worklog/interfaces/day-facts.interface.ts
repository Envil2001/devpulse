export interface CommandKindFacts {
  runs: number;
  failed: number;
  /** Result of the last finished run of the day. Null when no run reported an exit code. */
  lastRunPassed: boolean | null;
}

/**
 * Everything the model is allowed to know about one working day.
 * Raw terminal commands remain private. File activity is limited to five sanitised,
 * workspace-relative paths and is sent only when the user requests an AI worklog.
 */
export interface DayFacts {
  /** Local date of the user, yyyy-MM-dd. */
  date: string;
  activeMinutes: number;
  focusScore: number;
  projects: Array<{ name: string; minutes: number; branches: Array<string> }>;
  languages: Array<{ name: string; percent: number }>;
  hotFiles: Array<{ path: string; minutes: number; percent: number }>;
  terminal: {
    totalRuns: number;
    failedRuns: number;
    tests: CommandKindFacts | null;
    builds: CommandKindFacts | null;
    lint: CommandKindFacts | null;
  };
  commits: Array<{ message: string; insertions: number; deletions: number }>;
  /** Share of active time in AI-assisted sessions. Null when no AI usage was detected. */
  aiAssistedPercent: number | null;
}

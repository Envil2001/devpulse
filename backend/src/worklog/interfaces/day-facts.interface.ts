export interface CommandKindFacts {
  runs: number;
  failed: number;
  lastRunPassed: boolean | null;
}

export interface DayFacts {
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
  aiAssistedPercent: number | null;
}

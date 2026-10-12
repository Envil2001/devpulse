export interface UtcRange {
  startKey: string;
  endKey: string;
  start: Date;
  endExclusive: Date;
}

export interface SessionAggregate {
  totalActiveSeconds: number;
  weightedFocus: number;
  branches: Set<string>;
  projects: Map<string, number>;
  languages: Map<string, number>;
  commands: CommandAggregate;
}

export interface CommandKindStats {
  runs: number;
  failed: number;
  totalDurationMs: number;
}

export interface CommandAggregate {
  totalRuns: number;
  totalFailed: number;
  byKind: Map<string, CommandKindStats>;
}

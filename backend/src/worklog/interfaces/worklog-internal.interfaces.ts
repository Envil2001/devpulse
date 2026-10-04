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
}

export type TelemetryEventType =
  | 'heartbeat'
  | 'file_open'
  | 'file_save'
  | 'file_switch'
  | 'idle_start'
  | 'idle_end';

export interface TelemetryEventPayload {
  type: TelemetryEventType;
  gitBranch: string | null;
  filePath: string | null;
  language: string | null;
  durationMs: number | null;
  clientTimestamp: string; // ISO string
}

export interface TelemetryBatchRequest {
  events: Array<TelemetryEventPayload>;
}

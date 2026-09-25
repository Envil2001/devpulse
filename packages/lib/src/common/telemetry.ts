export interface TelemetryEventDto {
  type: 'heartbeat' | 'file_save' | 'file_switch' | 'idle_start' | 'idle_end' | 'session_end';
  gitBranch: string | null;
  gitRemoteUrl?: string;
  filePath?: string;
  language?: string;
  durationMs?: number | null;
  clientTimestamp?: string;
}

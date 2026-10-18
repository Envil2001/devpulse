export interface TelemetryEventDto {
  type:
    | 'heartbeat'
    | 'file_save'
    | 'file_switch'
    | 'idle_start'
    | 'idle_end'
    | 'session_end'
    | 'terminal_command'
    | 'task_run'
    | 'git_commit';

  gitBranch: string | null;
  gitRemoteUrl?: string;
  filePath?: string;
  language?: string;
  durationMs?: number | null;
  clientTimestamp?: string;
  machineId?: string;
  sessionId?: string;

  command?: string;
  commandCwd?: string | null;
  exitCode?: number | null;

  taskName?: string;
  taskSource?: string;

  commitHash?: string;
  commitMessage?: string;
  filesChanged?: number;
  insertions?: number;
  deletions?: number;
  filesList?: Array<string>;
}

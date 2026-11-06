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
    | 'git_commit'
    | 'ai_interaction';

  gitBranch: string | null;
  gitRemoteUrl?: string;
  /** Workspace-relative path. Null means that no trackable editor is active. */
  filePath?: string | null;
  language?: string;
  durationMs?: number | null;
  clientTimestamp?: string;
  /** Actual activity-state boundary; may precede delivery after an idle grace period. */
  activityChangedAt?: string;
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

  aiTool?: string;
  aiEstimated?: boolean;
}

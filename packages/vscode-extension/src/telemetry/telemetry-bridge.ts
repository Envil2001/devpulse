import path from 'node:path';

import * as vscode from 'vscode';

import type { TelemetryEventDto } from '@devpulse/lib';

import type { ActivityMonitor, ActivityState } from '../activity-monitor.js';
import type { GitContext, GitContextProvider } from '../git-context.js';
import { sanitizeCommand } from '../signals/command-sanitizer.js';
import { type TasksMonitor } from '../signals/tasks-monitor.js';
import { type TerminalMonitor } from '../signals/terminal-monitor.js';

import { TelemetryApiClient } from './api-client.js';
import { TelemetryBufferStore } from './buffer-store.js';

const FLUSH_INTERVAL_MS = 60_000;
const FLUSH_SIZE_THRESHOLD = 50;
const FLUSH_DEBOUNCE_MS = 5000;
const HEARTBEAT_INTERVAL_MS = 60_000;
const CONTEXT_LOSS_GRACE_MS = 2 * 60 * 1000;
const PENDING_BUFFER_TTL_MS = 2 * 60 * 1000;

function isTrackedDocument(uri: vscode.Uri): boolean {
  return uri.scheme === 'file' || uri.scheme === 'untitled';
}
function isRelativeWorkspacePath(uri: vscode.Uri): boolean {
  const rel = vscode.workspace.asRelativePath(uri, false);
  return !path.isAbsolute(rel);
}
export class TelemetryBridge implements vscode.Disposable {
  private readonly disposables: Array<vscode.Disposable> = [];
  private readonly client: TelemetryApiClient;
  private readonly bufferStore = new TelemetryBufferStore();
  private readonly pendingBuffer: Array<{
    type: 'terminal_command' | 'task_run';
    partial: {
      command?: string;
      commandCwd?: string | null;
      exitCode?: number | null;
      durationMs?: number | null;
      taskName?: string;
      taskSource?: string;
    };
    createdAt: number;
  }> = [];

  private timer: ReturnType<typeof setInterval> | undefined;
  private heartbeatTimer: ReturnType<typeof setInterval> | undefined;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private contextLossTimer: ReturnType<typeof setTimeout> | undefined;

  private queue: Array<TelemetryEventDto> = [];
  private flushing = false;
  private stopped = false;
  private savePromise: Promise<void> = Promise.resolve();

  private lastActivityState: ActivityState | null = null;
  private lastActivityChangeAtMs: number | null = null;
  private lastObservedGitBranch: string | null = null;
  private lastObservedGitRemoteUrl: string | null = null;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly activityMonitor: ActivityMonitor,
    private readonly gitContextProvider: GitContextProvider,
    private readonly terminalMonitor: TerminalMonitor,
    private readonly tasksMonitor: TasksMonitor,
    private readonly log?: vscode.OutputChannel,
  ) {
    this.client = new TelemetryApiClient(context, log);
  }

  public async start(): Promise<void> {
    this.queue = this.bufferStore.load(this.context);

    const initialContext = this.gitContextProvider.currentContext;
    this.lastActivityState = this.activityMonitor.currentState;
    this.lastActivityChangeAtMs = Date.now();
    this.lastObservedGitBranch = initialContext.gitBranch;
    this.lastObservedGitRemoteUrl = initialContext.gitRemoteUrl;

    this.disposables.push(
      this.activityMonitor.onDidChangeActivityState(({ state, changedAt }) => {
        this.onActivityTransition(state, changedAt);
      }),

      this.gitContextProvider.onDidChangeContext((nextContext) => {
        this.onGitContextTransition(nextContext);
      }),

      vscode.workspace.onDidSaveTextDocument((doc) => {
        if (doc.isClosed) return;
        if (!isTrackedDocument(doc.uri)) return;
        if (!isRelativeWorkspacePath(doc.uri)) return;
        this.log?.appendLine(`[trace] file_save: ${this.toRelativePath(doc.uri)}`);
        this.enqueue(
          this.createEvent('file_save', {
            filePath: this.toRelativePath(doc.uri),
            language: doc.languageId,
          }),
        );
      }),

      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor === undefined) return;
        if (!isTrackedDocument(editor.document.uri)) return;
        if (!isRelativeWorkspacePath(editor.document.uri)) return;
        this.log?.appendLine(`[trace] file_switch: ${this.toRelativePath(editor.document.uri)}`);
        this.enqueue(
          this.createEvent('file_switch', {
            filePath: this.toRelativePath(editor.document.uri),
            language: editor.document.languageId,
          }),
        );
      }),

      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('devpulse.apiUrl')) {
          void this.flush();
        }
      }),

      this.terminalMonitor.onDidRunCommand((event) => {
        const sanitized = sanitizeCommand(event.command);
        if (!sanitized) return;

        this.log?.appendLine(
          `[trace] terminal: ${sanitized} (exit=${String(event.exitCode ?? 'n/a')}, ${String(event.durationMs)}ms)`,
        );

        this.enqueueWithBuffer('terminal_command', {
          command: sanitized,
          commandCwd: event.cwd,
          exitCode: event.exitCode,
          durationMs: event.durationMs,
        });
      }),

      this.tasksMonitor.onDidRunTask((event) => {
        this.log?.appendLine(
          `[trace] task: ${event.name} (exit=${String(event.exitCode ?? 'n/a')}, ${String(event.durationMs)}ms)`,
        );

        this.enqueueWithBuffer('task_run', {
          taskName: event.name,
          taskSource: event.source,
          exitCode: event.exitCode,
          durationMs: event.durationMs,
        });
      }),
    );

    this.timer = setInterval(() => {
      void this.flush();
    }, FLUSH_INTERVAL_MS);

    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    if (this.gitContextProvider.currentContext.gitBranch) {
      this.enqueue(this.createEvent('heartbeat', { durationMs: null }));
      await this.flush();
    }
  }

  private sendHeartbeat(): void {
    if (this.stopped) return;

    if (!vscode.env.isTelemetryEnabled) {
      this.log?.appendLine('[debug] heartbeat skipped: VS Code telemetry disabled');
      return;
    }

    if (this.activityMonitor.currentState !== 'active') {
      this.log?.appendLine(`[debug] heartbeat skipped: state=${this.activityMonitor.currentState}`);
      return;
    }

    if (!this.gitContextProvider.currentContext.gitBranch) {
      this.log?.appendLine('[debug] heartbeat skipped: no git branch');
      return;
    }

    this.log?.appendLine('[debug] heartbeat sent');
    this.enqueue(this.createEvent('heartbeat', { durationMs: null }));
  }

  private toRelativePath(uri: vscode.Uri): string {
    return vscode.workspace.asRelativePath(uri, false);
  }

  private onActivityTransition(next: ActivityState, changedAt: number): void {
    const prev = this.lastActivityState;
    const prevAt = this.lastActivityChangeAtMs;

    this.log?.appendLine(`[debug] activity transition: ${prev ?? 'initial'} → ${next}`);

    if (prev !== null && prevAt !== null && prev !== next) {
      const durationMs = Math.max(0, changedAt - prevAt);
      const eventType: 'idle_start' | 'idle_end' = next === 'idle' ? 'idle_start' : 'idle_end';
      this.enqueue(this.createEvent(eventType, { durationMs }));
    }

    this.lastActivityState = next;
    this.lastActivityChangeAtMs = changedAt;
  }

  private onGitContextTransition(nextContext: GitContext): void {
    const providerPrevious = this.gitContextProvider.currentContext.gitBranch;
    const nextBranch = nextContext.gitBranch;

    if (providerPrevious !== nextBranch) {
      this.log?.appendLine(
        `[debug] git context transition: branch="${providerPrevious ?? 'n/a'}" → "${nextBranch ?? 'n/a'}"`,
      );
    }

    const previousBranch = this.lastObservedGitBranch;
    const previousRemoteUrl = this.lastObservedGitRemoteUrl;
    const nextRemoteUrl = nextContext.gitRemoteUrl;

    if (nextBranch === null) {
      this.scheduleContextLossEnd();
      return;
    }

    this.clearContextLossTimer();

    if (previousBranch === nextBranch && previousRemoteUrl === nextRemoteUrl) {
      return;
    }

    const boundaryTimestamp = new Date().toISOString();

    if (previousBranch !== null) {
      this.enqueue(
        this.createEvent('session_end', {
          gitBranch: previousBranch,
          gitRemoteUrl: previousRemoteUrl,
          clientTimestamp: boundaryTimestamp,
        }),
      );
    }

    this.enqueue(
      this.createEvent('heartbeat', {
        durationMs: null,
        gitBranch: nextBranch,
        gitRemoteUrl: nextRemoteUrl,
        clientTimestamp: boundaryTimestamp,
      }),
    );

    this.lastObservedGitBranch = nextBranch;
    this.lastObservedGitRemoteUrl = nextRemoteUrl;
    this.flushPendingBuffer();
  }

  private scheduleContextLossEnd(): void {
    this.clearContextLossTimer();

    this.contextLossTimer = setTimeout(() => {
      this.contextLossTimer = undefined;

      if (this.lastObservedGitBranch !== null) {
        this.log?.appendLine(
          `[debug] context loss grace period expired, ending session on ${this.lastObservedGitBranch}`,
        );

        this.enqueue(
          this.createEvent('session_end', {
            gitBranch: this.lastObservedGitBranch,
            gitRemoteUrl: this.lastObservedGitRemoteUrl,
          }),
        );

        this.lastObservedGitBranch = null;
        this.lastObservedGitRemoteUrl = null;
      }
    }, CONTEXT_LOSS_GRACE_MS);
  }

  private clearContextLossTimer(): void {
    if (this.contextLossTimer !== undefined) {
      clearTimeout(this.contextLossTimer);
      this.contextLossTimer = undefined;
    }
  }

  private createEvent(
    type:
      | 'heartbeat'
      | 'file_save'
      | 'file_switch'
      | 'idle_start'
      | 'idle_end'
      | 'session_end'
      | 'terminal_command'
      | 'task_run',
    partial: {
      durationMs?: number | null;
      filePath?: string | null;
      language?: string | null;
      clientTimestamp?: string;
      gitBranch?: string;
      gitRemoteUrl?: string | null;
      command?: string;
      commandCwd?: string | null;
      exitCode?: number | null;
      taskName?: string;
      taskSource?: string;
    } = {},
  ): TelemetryEventDto {
    const current = this.gitContextProvider.currentContext;

    const gitBranch = partial.gitBranch ?? current.gitBranch ?? this.lastObservedGitBranch;
    const gitRemoteUrl =
      partial.gitRemoteUrl ?? current.gitRemoteUrl ?? this.lastObservedGitRemoteUrl;

    return {
      type,
      gitBranch,
      gitRemoteUrl: gitRemoteUrl ?? undefined,
      clientTimestamp: partial.clientTimestamp ?? new Date().toISOString(),
      durationMs: partial.durationMs,
      filePath: partial.filePath ?? undefined,
      language: partial.language ?? undefined,
      machineId: vscode.env.machineId,
      sessionId: vscode.env.sessionId,
      command: partial.command,
      commandCwd: partial.commandCwd ?? undefined,
      exitCode: partial.exitCode,
      taskName: partial.taskName,
      taskSource: partial.taskSource,
    };
  }

  private enqueue(event: TelemetryEventDto): void {
    if (!vscode.env.isTelemetryEnabled) {
      this.log?.appendLine(`[debug] skipped ${event.type}: VS Code telemetry disabled`);
      return;
    }

    if (event.gitBranch === null) {
      this.log?.appendLine(`[debug] skipped ${event.type}: no git branch`);
      return;
    }

    this.log?.appendLine(`[trace] enqueue: type=${event.type} branch=${event.gitBranch}`);
    this.queue.push(event);
    this.persistQueue();

    if (this.queue.length >= FLUSH_SIZE_THRESHOLD) {
      this.clearDebounceTimer();
      void this.flush();
      return;
    }

    this.scheduleDebouncedFlush();
  }

  private enqueueWithBuffer(
    type: 'terminal_command' | 'task_run',
    partial: {
      command?: string;
      commandCwd?: string | null;
      exitCode?: number | null;
      durationMs?: number | null;
      taskName?: string;
      taskSource?: string;
    },
  ): void {
    const event = this.createEvent(type, partial);

    if (event.gitBranch === null) {
      this.pendingBuffer.push({ type, partial, createdAt: Date.now() });
      this.log?.appendLine(
        `[debug] buffered ${type}: waiting for git context (${String(this.pendingBuffer.length)} in buffer)`,
      );
      return;
    }

    this.enqueue(event);
  }

  private flushPendingBuffer(): void {
    if (this.pendingBuffer.length === 0) return;

    const now = Date.now();
    const stillValid: typeof this.pendingBuffer = [];
    let dropped = 0;

    for (const item of this.pendingBuffer) {
      if (now - item.createdAt < PENDING_BUFFER_TTL_MS) {
        stillValid.push(item);
      } else {
        dropped += 1;
      }
    }

    this.pendingBuffer.length = 0;

    if (dropped > 0) {
      this.log?.appendLine(`[debug] dropped ${String(dropped)} buffered events (too old)`);
    }

    if (stillValid.length > 0) {
      this.log?.appendLine(`[debug] flushing ${String(stillValid.length)} buffered events`);
    }

    for (const item of stillValid) {
      const event = this.createEvent(item.type, item.partial);
      if (event.gitBranch !== null) {
        this.enqueue(event);
      }
    }
  }

  private scheduleDebouncedFlush(): void {
    this.clearDebounceTimer();

    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      void this.flush();
    }, FLUSH_DEBOUNCE_MS);
  }

  private clearDebounceTimer(): void {
    if (this.debounceTimer !== undefined) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
  }

  private persistQueue(): void {
    const snapshot = [...this.queue];

    this.savePromise = this.savePromise
      .then(() => this.bufferStore.save(this.context, snapshot))
      .catch((error: unknown) => {
        this.log?.appendLine(`[telemetry] buffer save failed: ${String(error)}`);
      });
  }

  public stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    this.clearContextLossTimer();
    this.pendingBuffer.length = 0;
    if (this.heartbeatTimer !== undefined) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }

    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    this.clearDebounceTimer();

    if (this.lastObservedGitBranch !== null) {
      this.enqueue(
        this.createEvent('session_end', {
          gitBranch: this.lastObservedGitBranch,
          gitRemoteUrl: this.lastObservedGitRemoteUrl,
        }),
      );
    }
  }

  public async flush(signal?: AbortSignal): Promise<void> {
    if (this.flushing) {
      return;
    }

    if (this.queue.length === 0) {
      return;
    }

    this.flushing = true;

    const beforeSize = this.queue.length;
    const batch = this.queue.splice(0, this.queue.length);

    try {
      this.log?.appendLine(
        `[debug] flush: sending ${String(batch.length)} events (queue: ${String(beforeSize)} → 0)`,
      );

      await this.client.postEventsBatch(
        {
          events: batch,
        },
        signal,
      );

      this.persistQueue();

      this.log?.appendLine(`[info] flushed ${String(batch.length)} events`);
    } catch (error) {
      this.queue.unshift(...batch);

      this.persistQueue();

      const message = error instanceof Error ? error.message : String(error);

      this.log?.appendLine(
        `[error] flush failed (${message}); buffered=${String(this.queue.length)}`,
      );
    } finally {
      this.flushing = false;
    }
  }

  public dispose(): void {
    this.stop();

    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}

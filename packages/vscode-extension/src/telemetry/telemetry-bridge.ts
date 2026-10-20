import path from 'node:path';

import * as vscode from 'vscode';

import type { TelemetryEventDto } from '@devpulse/lib';

import type { ActivityMonitor, ActivityState } from '../activity-monitor.js';
import type { GitContext, GitContextProvider } from '../git-context.js';
import { sanitizeCommand } from '../signals/command-sanitizer.js';
import { type GitCommitWatcher } from '../signals/git-commit-watcher.js';
import type { TasksMonitor } from '../signals/tasks-monitor.js';
import type { TerminalMonitor } from '../signals/terminal-monitor.js';
import { type StatusBarState } from '../status-bar/status-bar-state.js';

import { ContextTracker } from './bridge/context-tracker.js';
import { createEvent, type EventPartial, type TelemetryEventType } from './bridge/event-factory.js';
import { FlushScheduler } from './bridge/flush-scheduler.js';
import { PendingBuffer } from './bridge/pending-buffer.js';
import { TelemetryApiClient } from './api-client.js';
import { TelemetryBufferStore } from './buffer-store.js';
import { TelemetryRequestError } from './telemetry-request-error.js';

function isTrackedDocument(uri: vscode.Uri): boolean {
  return uri.scheme === 'file' || uri.scheme === 'untitled';
}

function isRelativeWorkspacePath(uri: vscode.Uri): boolean {
  const rel = vscode.workspace.asRelativePath(uri, false);
  return !path.isAbsolute(rel);
}
const RETRY_BASE_DELAY_MS = 30_000;
const RETRY_MAX_DELAY_MS = 15 * 60 * 1000;
export class TelemetryBridge implements vscode.Disposable {
  private readonly disposables: Array<vscode.Disposable> = [];
  private readonly client: TelemetryApiClient;
  private readonly bufferStore = new TelemetryBufferStore();
  private readonly contextTracker: ContextTracker;
  private readonly pendingBuffer = new PendingBuffer();
  private readonly flushScheduler: FlushScheduler;

  private queue: Array<TelemetryEventDto> = [];
  private flushing = false;
  private stopped = false;
  private paused = false;
  private savePromise: Promise<void> = Promise.resolve();

  private lastActivityState: ActivityState | null = null;
  private lastActivityChangeAtMs: number | null = null;

  private consecutiveFailures = 0;
  private nextAttemptAt = 0;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly activityMonitor: ActivityMonitor,
    private readonly gitContextProvider: GitContextProvider,
    private readonly terminalMonitor: TerminalMonitor,
    private readonly tasksMonitor: TasksMonitor,
    private readonly gitCommitWatcher: GitCommitWatcher,
    private readonly statusBarState: StatusBarState,
    private readonly log?: vscode.LogOutputChannel,
  ) {
    this.client = new TelemetryApiClient(context, log);
    this.contextTracker = new ContextTracker(log);
    this.flushScheduler = new FlushScheduler({
      flush: () => {
        void this.flush();
      },
      heartbeat: () => {
        this.sendHeartbeat();
      },
    });
  }

  public pause(): void {
    if (this.paused) return;
    this.paused = true;
    this.log?.info('telemetry paused');
    void this.flush();
  }

  public resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.log?.info('telemetry resumed');
  }

  public async start(): Promise<void> {
    this.queue = this.bufferStore.load(this.context);

    const initialContext = this.gitContextProvider.currentContext;
    this.lastActivityState = this.activityMonitor.currentState;
    this.lastActivityChangeAtMs = Date.now();
    this.contextTracker.update(initialContext);

    this.registerListeners();
    this.flushScheduler.start();
    void this.gitCommitWatcher.setWorkspaceFolder(initialContext.workspaceFolderPath);
    if (initialContext.gitBranch) {
      this.enqueue(this.create('heartbeat', { durationMs: null }));
      await this.flush();
    }
  }

  public async shutdown(signal: AbortSignal): Promise<void> {
    this.stop();

    await this.savePromise;

    await this.flush(signal, true);
  }

  private registerListeners(): void {
    this.disposables.push(
      this.activityMonitor.onDidChangeActivityState(({ state, changedAt }) => {
        this.onActivityTransition(state, changedAt);
      }),

      this.gitContextProvider.onDidChangeContext((nextContext) => {
        this.onGitContextTransition(nextContext);
      }),

      this.contextTracker.onGracePeriodExpired(() => {
        const branch = this.contextTracker.branch;
        if (branch !== null) {
          this.enqueue(
            this.create('session_end', {
              gitBranch: branch,
              gitRemoteUrl: this.contextTracker.remoteUrl,
            }),
          );
        }
      }),

      vscode.workspace.onDidSaveTextDocument((doc) => {
        if (!this.shouldTrack(doc.uri)) return;
        this.log?.info(`file_save: ${this.toRelativePath(doc.uri)}`);
        this.enqueue(
          this.create('file_save', {
            filePath: this.toRelativePath(doc.uri),
            language: doc.languageId,
          }),
        );
      }),

      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor === undefined) return;
        if (!this.shouldTrack(editor.document.uri)) return;
        this.log?.info(`file_switch: ${this.toRelativePath(editor.document.uri)}`);
        this.enqueue(
          this.create('file_switch', {
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

        this.log?.info(
          `terminal: ${sanitized} (exit=${String(event.exitCode ?? 'n/a')}, ${String(event.durationMs)}ms)`,
        );

        this.enqueueWithBuffer('terminal_command', {
          command: sanitized,
          commandCwd: event.cwd,
          exitCode: event.exitCode,
          durationMs: event.durationMs,
        });
      }),

      this.tasksMonitor.onDidRunTask((event) => {
        this.log?.info(
          `task: ${event.name} (exit=${String(event.exitCode ?? 'n/a')}, ${String(event.durationMs)}ms)`,
        );

        this.enqueueWithBuffer('task_run', {
          taskName: event.name,
          taskSource: event.source,
          exitCode: event.exitCode,
          durationMs: event.durationMs,
        });
      }),

      this.gitCommitWatcher.onDidCommit((event) => {
        this.log?.info(
          `commit: ${event.hash.slice(0, 7)} (${String(event.insertions)}+/${String(event.deletions)}-)`,
        );

        this.enqueue(
          this.create('git_commit', {
            commitHash: event.hash,
            commitMessage: event.message,
            filesChanged: event.filesChanged,
            insertions: event.insertions,
            deletions: event.deletions,
            filesList: event.filesList,
          }),
        );
      }),
    );
  }

  private shouldTrack(uri: vscode.Uri): boolean {
    return isTrackedDocument(uri) && isRelativeWorkspacePath(uri);
  }

  private create(type: TelemetryEventType, partial: EventPartial): TelemetryEventDto {
    const current = this.gitContextProvider.currentContext;

    return createEvent(type, partial, {
      currentBranch: current.gitBranch,
      currentRemoteUrl: current.gitRemoteUrl,
      fallbackBranch: this.contextTracker.branch,
      fallbackRemoteUrl: this.contextTracker.remoteUrl,
    });
  }

  private sendHeartbeat(): void {
    if (this.stopped || this.paused) return;

    if (!vscode.env.isTelemetryEnabled) {
      this.log?.info('heartbeat skipped: VS Code telemetry disabled');
      return;
    }

    if (this.activityMonitor.currentState !== 'active') {
      this.log?.info(`heartbeat skipped: state=${this.activityMonitor.currentState}`);
      return;
    }

    const event = this.create('heartbeat', { durationMs: null });

    if (event.gitBranch === null) {
      this.log?.info('heartbeat skipped: no git branch');
      return;
    }

    this.log?.info('heartbeat sent');
    this.enqueue(event);
  }

  private toRelativePath(uri: vscode.Uri): string {
    return vscode.workspace.asRelativePath(uri, false);
  }

  private onActivityTransition(next: ActivityState, changedAt: number): void {
    const prev = this.lastActivityState;
    const prevAt = this.lastActivityChangeAtMs;

    this.log?.info(`activity transition: ${prev ?? 'initial'} → ${next}`);

    if (prev !== null && prevAt !== null && prev !== next) {
      const durationMs = Math.max(0, changedAt - prevAt);
      const eventType: 'idle_start' | 'idle_end' = next === 'idle' ? 'idle_start' : 'idle_end';
      this.enqueue(this.create(eventType, { durationMs }));
    }

    this.lastActivityState = next;
    this.lastActivityChangeAtMs = changedAt;
  }

  private onGitContextTransition(nextContext: GitContext): void {
    const previousBranch = this.contextTracker.branch;
    const previousRemoteUrl = this.contextTracker.remoteUrl;

    const result = this.contextTracker.update(nextContext);

    if (result === 'changed' || result === 'lost') {
      this.log?.info(
        `git context transition: branch="${previousBranch ?? 'n/a'}" → "${nextContext.gitBranch ?? 'n/a'}"`,
      );
    }

    if (result === 'lost' || result === 'noop') {
      return;
    }

    void this.gitCommitWatcher.setWorkspaceFolder(nextContext.workspaceFolderPath);

    if (result === 'restored') {
      this.flushPendingBuffer();
      return;
    }

    const boundaryTimestamp = new Date().toISOString();

    if (previousBranch !== null) {
      this.enqueue(
        this.create('session_end', {
          gitBranch: previousBranch,
          gitRemoteUrl: previousRemoteUrl,
          clientTimestamp: boundaryTimestamp,
        }),
      );
    }

    this.enqueue(
      this.create('heartbeat', {
        durationMs: null,
        gitBranch: nextContext.gitBranch ?? undefined,
        gitRemoteUrl: nextContext.gitRemoteUrl,
        clientTimestamp: boundaryTimestamp,
      }),
    );

    this.flushPendingBuffer();
  }

  private enqueue(event: TelemetryEventDto): void {
    if (this.paused) {
      this.log?.info(`skipped ${event.type}: tracking paused`);
      return;
    }

    if (!vscode.env.isTelemetryEnabled) {
      this.log?.info(`skipped ${event.type}: VS Code telemetry disabled`);
      return;
    }

    if (event.gitBranch === null) {
      this.log?.info(`skipped ${event.type}: no git branch`);
      return;
    }

    this.log?.info(`enqueue: type=${event.type} branch=${event.gitBranch}`);
    this.queue.push(event);
    this.persistQueue();

    const { immediate } = this.flushScheduler.scheduleFlush(this.queue.length);
    if (immediate) {
      void this.flush();
    }
  }

  private enqueueWithBuffer(type: 'terminal_command' | 'task_run', partial: EventPartial): void {
    if (this.stopped || this.paused) return;
    const event = this.create(type, partial);

    if (event.gitBranch === null) {
      this.pendingBuffer.push({ type, partial, createdAt: Date.now() });
      this.log?.info(
        `buffered ${type}: waiting for git context (${String(this.pendingBuffer.size)} in buffer)`,
      );
      return;
    }

    this.enqueue(event);
  }

  private flushPendingBuffer(): void {
    const { valid, dropped } = this.pendingBuffer.drain();

    if (dropped > 0) {
      this.log?.info(`dropped ${String(dropped)} buffered events (too old)`);
    }

    if (valid.length > 0) {
      this.log?.info(`flushing ${String(valid.length)} buffered events`);
    }

    for (const item of valid) {
      const event = this.create(item.type, item.partial);
      if (event.gitBranch !== null) {
        this.enqueue(event);
      }
    }
  }

  private persistQueue(): void {
    const snapshot = [...this.queue];

    this.savePromise = this.savePromise
      .then(() => this.bufferStore.save(this.context, snapshot))
      .catch((error: unknown) => {
        this.log?.error(`buffer save failed: ${String(error)}`);
      });
  }

  public stop(): void {
    if (this.stopped) return;
    this.stopped = true;

    this.flushScheduler.stop();

    const branch = this.contextTracker.branch;
    if (branch !== null) {
      this.enqueue(
        this.create('session_end', {
          gitBranch: branch,
          gitRemoteUrl: this.contextTracker.remoteUrl,
        }),
      );
    }

    this.contextTracker.reset();
    this.pendingBuffer.clear();
  }

  public async flush(signal?: AbortSignal, force = false): Promise<void> {
    if (this.flushing || this.queue.length === 0) return;
    if (!force && Date.now() < this.nextAttemptAt) return;

    this.flushing = true;
    const batch = this.queue.splice(0, this.queue.length);

    try {
      await this.client.postEventsBatch({ events: batch }, signal);

      this.consecutiveFailures = 0;
      this.nextAttemptAt = 0;
      this.persistQueue();

      this.statusBarState.setHealth('ok');

      this.log?.info(`flushed ${String(batch.length)} events`);
    } catch (error: unknown) {
      if (error instanceof TelemetryRequestError) {
        if (error.isAuthError) {
          this.statusBarState.setHealth('invalid-key'); // 401, 403
        } else if (error.retryable) {
          this.statusBarState.setHealth('offline');
        } else {
          this.statusBarState.setHealth('error');
        }
      } else {
        this.statusBarState.setHealth('offline');
      }

      if (error instanceof TelemetryRequestError && !error.retryable && !error.isAuthError) {
        this.persistQueue();
        this.log?.error(
          `dropped ${String(batch.length)} events: rejected by server (${String(error.status)})`,
        );
        return;
      }

      this.queue = [...batch, ...this.queue];
      this.persistQueue();

      this.consecutiveFailures += 1;
      this.nextAttemptAt =
        Date.now() +
        Math.min(RETRY_BASE_DELAY_MS * 2 ** (this.consecutiveFailures - 1), RETRY_MAX_DELAY_MS);

      const message = error instanceof Error ? error.message : String(error);
      this.log?.error(`flush failed (${message}); buffered=${String(this.queue.length)}`);
    } finally {
      this.flushing = false;
    }
  }

  public dispose(): void {
    this.stop();
    this.contextTracker.dispose();

    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}

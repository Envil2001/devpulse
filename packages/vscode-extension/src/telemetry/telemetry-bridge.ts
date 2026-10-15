import path from 'node:path';

import * as vscode from 'vscode';

import type { TelemetryEventDto } from '@devpulse/lib';

import type { ActivityMonitor, ActivityState } from '../activity-monitor.js';
import type { GitContext, GitContextProvider } from '../git-context.js';
import { sanitizeCommand } from '../signals/command-sanitizer.js';
import type { TasksMonitor } from '../signals/tasks-monitor.js';
import type { TerminalMonitor } from '../signals/terminal-monitor.js';

import { ContextTracker } from './bridge/context-tracker.js';
import { createEvent, type EventPartial, type TelemetryEventType } from './bridge/event-factory.js';
import { FlushScheduler } from './bridge/flush-scheduler.js';
import { PendingBuffer } from './bridge/pending-buffer.js';
import { TelemetryApiClient } from './api-client.js';
import { TelemetryBufferStore } from './buffer-store.js';

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

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly activityMonitor: ActivityMonitor,
    private readonly gitContextProvider: GitContextProvider,
    private readonly terminalMonitor: TerminalMonitor,
    private readonly tasksMonitor: TasksMonitor,
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

    if (initialContext.gitBranch) {
      this.enqueue(this.create('heartbeat', { durationMs: null }));
      await this.flush();
    }
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
    const providerPrevious = this.gitContextProvider.currentContext.gitBranch;
    const nextBranch = nextContext.gitBranch;

    if (providerPrevious !== nextBranch) {
      this.log?.info(
        `git context transition: branch="${providerPrevious ?? 'n/a'}" → "${nextBranch ?? 'n/a'}"`,
      );
    }

    const previousBranch = this.contextTracker.branch;
    const previousRemoteUrl = this.contextTracker.remoteUrl;

    const result = this.contextTracker.update(nextContext);

    if (result === 'lost' || result === 'noop') {
      return;
    }

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
        gitBranch: nextBranch ?? undefined,
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

  public async flush(signal?: AbortSignal): Promise<void> {
    if (this.flushing) return;
    if (this.queue.length === 0) return;

    this.flushing = true;

    const beforeSize = this.queue.length;
    const batch = this.queue.splice(0, this.queue.length);

    try {
      this.log?.info(
        `flush: sending ${String(batch.length)} events (queue: ${String(beforeSize)} → 0)`,
      );

      await this.client.postEventsBatch({ events: batch }, signal);
      this.persistQueue();

      this.log?.info(`flushed ${String(batch.length)} events`);
    } catch (error) {
      this.queue.unshift(...batch);
      this.persistQueue();

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

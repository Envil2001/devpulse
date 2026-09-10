import * as vscode from 'vscode';

import type { TelemetryEventDto } from '@devpulse/lib';

import type { ActivityMonitor, ActivityState } from '../activity-monitor.js';
import type { GitContext, GitContextProvider } from '../git-context.js';

import { TelemetryApiClient } from './api-client.js';
import { TelemetryBufferStore } from './buffer-store.js';

const FLUSH_INTERVAL_MS = 60_000;
const FLUSH_SIZE_THRESHOLD = 50;
const FLUSH_DEBOUNCE_MS = 5000;

export class TelemetryBridge implements vscode.Disposable {
  private readonly disposables: Array<vscode.Disposable> = [];
  private readonly client: TelemetryApiClient;
  private readonly bufferStore = new TelemetryBufferStore();

  private timer: ReturnType<typeof setInterval> | undefined;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private queue: Array<TelemetryEventDto> = [];
  private flushing = false;
  private savePromise: Promise<void> = Promise.resolve();

  private lastActivityState: ActivityState | null = null;
  private lastActivityChangeAtMs: number | null = null;
  private lastObservedGitBranch: string | null = null;
  private lastObservedGitRemoteUrl: string | null = null;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly activityMonitor: ActivityMonitor,
    private readonly gitContextProvider: GitContextProvider,
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

        this.enqueue(
          this.createEvent('file_save', {
            filePath: this.toRelativePath(doc.uri),
            language: doc.languageId,
          }),
        );
      }),

      vscode.window.onDidChangeActiveTextEditor((editor) => {
        this.enqueue(
          this.createEvent('file_switch', {
            filePath: editor === undefined ? null : this.toRelativePath(editor.document.uri),
            language: editor === undefined ? null : editor.document.languageId,
          }),
        );
      }),

      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('devpulse.apiUrl')) {
          void this.flush();
        }
      }),
    );

    this.timer = setInterval(() => {
      void this.flush();
    }, FLUSH_INTERVAL_MS);

    if (this.gitContextProvider.currentContext.gitBranch !== null) {
      this.enqueue(this.createEvent('heartbeat', { durationMs: null }));
      await this.flush();
    }
  }

  private toRelativePath(uri: vscode.Uri): string {
    return vscode.workspace.asRelativePath(uri, false);
  }

  private onActivityTransition(next: ActivityState, changedAt: number): void {
    const prev = this.lastActivityState;
    const prevAt = this.lastActivityChangeAtMs;

    if (prev !== null && prevAt !== null && prev !== next) {
      const durationMs = Math.max(0, changedAt - prevAt);
      const eventType: 'idle_start' | 'idle_end' = next === 'idle' ? 'idle_start' : 'idle_end';
      this.enqueue(this.createEvent(eventType, { durationMs }));
    }

    this.lastActivityState = next;
    this.lastActivityChangeAtMs = changedAt;
  }

  private onGitContextTransition(nextContext: GitContext): void {
    const previousBranch = this.lastObservedGitBranch;
    const previousRemoteUrl = this.lastObservedGitRemoteUrl;
    const nextBranch = nextContext.gitBranch;
    const nextRemoteUrl = nextContext.gitRemoteUrl;

    if (nextBranch === null) {
      this.lastObservedGitBranch = null;
      this.lastObservedGitRemoteUrl = null;
      return;
    }

    if (previousBranch === nextBranch && previousRemoteUrl === nextRemoteUrl) {
      return;
    }

    const boundaryTimestamp = new Date().toISOString();

    if (previousBranch !== null) {
      this.enqueue(
        this.createEvent('heartbeat', {
          durationMs: null,
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
  }

  private createEvent(
    type: 'heartbeat' | 'file_save' | 'file_switch' | 'idle_start' | 'idle_end',
    partial: {
      durationMs?: number | null;
      filePath?: string | null;
      language?: string | null;
      clientTimestamp?: string;
      gitBranch?: string | null;
      gitRemoteUrl?: string | null;
    } = {},
  ): TelemetryEventDto {
    const { gitBranch, gitRemoteUrl } = this.gitContextProvider.currentContext;

    return {
      type,
      gitBranch: partial.gitBranch ?? gitBranch ?? null,
      gitRemoteUrl: partial.gitRemoteUrl ?? gitRemoteUrl ?? undefined,
      clientTimestamp: partial.clientTimestamp ?? new Date().toISOString(),
      durationMs: partial.durationMs,
      filePath: partial.filePath ?? undefined,
      language: partial.language ?? undefined,
    };
  }

  private enqueue(event: TelemetryEventDto): void {
    if (event.gitBranch === null) {
      this.log?.appendLine(`[telemetry] skipped ${event.type}: no git branch`);
      return;
    }

    this.queue.push(event);
    this.persistQueue();

    if (this.queue.length >= FLUSH_SIZE_THRESHOLD) {
      this.clearDebounceTimer();
      void this.flush();
      return;
    }

    this.scheduleDebouncedFlush();
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

  public async flush(): Promise<void> {
    if (this.flushing) {
      return;
    }

    if (this.queue.length === 0) {
      return;
    }

    this.flushing = true;

    const batch = this.queue.splice(0, this.queue.length);

    try {
      this.log?.appendLine(
        `[telemetry] Sending payload: ${JSON.stringify({
          events: batch,
        })}`,
      );

      await this.client.postEventsBatch({
        events: batch,
      });

      this.persistQueue();

      this.log?.appendLine(`[telemetry] flushed ${String(batch.length)} events`);
    } catch (error) {
      this.queue.unshift(...batch);

      this.persistQueue();

      const message = error instanceof Error ? error.message : String(error);

      this.log?.appendLine(
        `[telemetry] flush skipped (${message}); buffered=${String(this.queue.length)}`,
      );
    } finally {
      this.flushing = false;
    }
  }

  public dispose(): void {
    this.clearDebounceTimer();

    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    for (const disposable of this.disposables) {
      disposable.dispose();
    }
  }
}

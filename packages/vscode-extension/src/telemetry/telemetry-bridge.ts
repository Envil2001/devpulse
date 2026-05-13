import * as vscode from 'vscode';

import type { ActivityMonitor, ActivityState } from '../activity-monitor.js';
import type { GitContext, GitContextProvider } from '../git-context.js';

import { TelemetryApiClient } from './api-client.js';
import { TelemetryBufferStore } from './buffer-store.js';
import { type TelemetryEventPayload } from './types.js';

const FLUSH_INTERVAL_MS = 60_000;

export class TelemetryBridge implements vscode.Disposable {
  private readonly disposables: Array<vscode.Disposable> = [];
  private readonly client: TelemetryApiClient;
  private readonly bufferStore = new TelemetryBufferStore();

  private timer: ReturnType<typeof setInterval> | undefined;
  private queue: Array<TelemetryEventPayload> = [];
  private flushing = false;

  private lastActivityState: ActivityState | null = null;
  private lastActivityChangeAtMs: number | null = null;
  private lastObservedGitBranch: string | null = null;

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

    // Ensure state is initialized so the first transition produces sensible durations.
    this.lastActivityState = this.activityMonitor.currentState;
    this.lastActivityChangeAtMs = Date.now();
    this.lastObservedGitBranch = this.gitContextProvider.currentContext.gitBranch;

    this.disposables.push(
      this.activityMonitor.onDidChangeActivityState((state) => {
        this.onActivityTransition(state);
      }),
      this.gitContextProvider.onDidChangeContext((nextContext) => {
        this.onGitContextTransition(nextContext);
      }),
      vscode.workspace.onDidSaveTextDocument((doc) => {
        if (doc.isClosed) {
          return;
        }
        this.enqueue(
          this.createEvent('file_save', { filePath: doc.uri.fsPath, language: doc.languageId }),
        );
      }),
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        const filePath = editor?.document.uri.fsPath ?? null;
        const language = editor?.document.languageId ?? null;
        this.enqueue(this.createEvent('file_switch', { filePath, language }));
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

    // Initial heartbeat helps validate wiring.
    this.enqueue(this.createEvent('heartbeat', { durationMs: null }));
    await this.flush();
  }

  private onActivityTransition(next: ActivityState): void {
    const now = Date.now();
    const prev = this.lastActivityState;
    const prevAt = this.lastActivityChangeAtMs;

    if (prev !== null && prevAt !== null && prev !== next) {
      const durationMs = Math.max(0, now - prevAt);
      const eventType: 'idle_start' | 'idle_end' = next === 'idle' ? 'idle_start' : 'idle_end';
      this.enqueue(this.createEvent(eventType, { durationMs }));
    }

    this.lastActivityState = next;
    this.lastActivityChangeAtMs = now;
  }

  private onGitContextTransition(nextContext: GitContext): void {
    const previousBranch = this.lastObservedGitBranch;
    const nextBranch = nextContext.gitBranch;

    if (previousBranch === nextBranch) {
      return;
    }

    // Emit explicit boundaries so backend aggregation splits time across branches
    // even when checkout happens between minute ticks.
    const boundaryTimestamp = new Date().toISOString();
    this.enqueue(
      this.createEvent('heartbeat', {
        durationMs: null,
        gitBranch: previousBranch,
        clientTimestamp: boundaryTimestamp,
      }),
    );
    this.enqueue(
      this.createEvent('heartbeat', {
        durationMs: null,
        gitBranch: nextBranch,
        clientTimestamp: boundaryTimestamp,
      }),
    );

    this.lastObservedGitBranch = nextBranch;
  }

  private createEvent(
    type: TelemetryEventPayload['type'],
    partial: Partial<Omit<TelemetryEventPayload, 'type'>>,
  ): TelemetryEventPayload {
    const { gitBranch } = this.gitContextProvider.currentContext;

    return {
      type,
      gitBranch: partial.gitBranch ?? gitBranch,
      filePath: partial.filePath ?? null,
      language: partial.language ?? null,
      durationMs: partial.durationMs ?? null,
      clientTimestamp: partial.clientTimestamp ?? new Date().toISOString(),
    };
  }

  private enqueue(event: TelemetryEventPayload): void {
    this.queue.push(event);
    void this.bufferStore.save(this.context, this.queue);
  }

  public async flush(): Promise<void> {
    if (this.flushing) {
      return;
    }
    if (this.queue.length === 0) {
      return;
    }

    this.flushing = true;
    try {
      const batch = this.queue;
      await this.client.postEventsBatch({ events: batch });
      this.queue = [];
      await this.bufferStore.save(this.context, this.queue);
      this.log?.appendLine(`[telemetry] flushed ${String(batch.length)} events`);
    } catch (error) {
      // Offline / missing API key / backend down: keep buffered.
      const message = error instanceof Error ? error.message : String(error);
      this.log?.appendLine(
        `[telemetry] flush skipped (${message}); buffered=${String(this.queue.length)}`,
      );
    } finally {
      this.flushing = false;
    }
  }

  public dispose(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    void this.flush();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}

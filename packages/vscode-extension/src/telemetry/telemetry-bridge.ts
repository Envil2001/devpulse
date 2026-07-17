import * as vscode from 'vscode';

import type { ActivityMonitor, ActivityState } from '../activity-monitor.js';
import type { GitContext, GitContextProvider } from '../git-context.js';

import { TelemetryApiClient } from './api-client.js';
import { TelemetryBufferStore } from './buffer-store.js';
import type { TelemetryEventDto } from '@devpulse/lib';

const FLUSH_INTERVAL_MS = 60_000;

export class TelemetryBridge implements vscode.Disposable {
  private readonly disposables: Array<vscode.Disposable> = [];
  private readonly client: TelemetryApiClient;
  private readonly bufferStore = new TelemetryBufferStore();

  private timer: ReturnType<typeof setInterval> | undefined;
  private queue: Array<TelemetryEventDto> = [];
  private flushing = false;

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
    this.queue = [];
    // this.queue = this.bufferStore.load(this.context);

    this.lastActivityState = this.activityMonitor.currentState;
    this.lastActivityChangeAtMs = Date.now();
    this.lastObservedGitBranch = this.gitContextProvider.currentContext.gitBranch;
    this.lastObservedGitRemoteUrl = this.gitContextProvider.currentContext.gitRemoteUrl;

    this.disposables.push(
      this.activityMonitor.onDidChangeActivityState(({ state, changedAt }) => {
        this.onActivityTransition(state, changedAt);
      }),
      this.gitContextProvider.onDidChangeContext((nextContext) => {
        this.onGitContextTransition(nextContext);
      }),
      vscode.workspace.onDidSaveTextDocument((doc) => {
        if (doc.isClosed) {
          return;
        }
        this.enqueue(this.createEvent('file_save', { filePath: doc.uri.fsPath }));
      }),
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        const filePath = editor?.document.uri.fsPath ?? null;
        const language = editor?.document.languageId ?? null;
        this.enqueue(this.createEvent('file_switch', { filePath: filePath }));
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

    this.enqueue(this.createEvent('heartbeat', { durationMs: null }));
    await this.flush();
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

    if (previousBranch === nextBranch && previousRemoteUrl === nextRemoteUrl) {
      return;
    }

    const boundaryTimestamp = new Date().toISOString();
    this.enqueue(
      this.createEvent('heartbeat', {
        durationMs: null,
        gitBranch: previousBranch,
        gitRemoteUrl: previousRemoteUrl,
        clientTimestamp: boundaryTimestamp,
      }),
    );
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
      clientTimestamp?: string;
      gitBranch?: string | null;
      gitRemoteUrl?: string | null;
    } = {},
  ): TelemetryEventDto {
    const { gitBranch, gitRemoteUrl } = this.gitContextProvider.currentContext;

    return {
      type,
      gitBranch: (partial.gitBranch ?? gitBranch) || 'unknown',
      gitRemoteUrl: partial.gitRemoteUrl ?? gitRemoteUrl ?? undefined,
      clientTimestamp: partial.clientTimestamp ?? new Date().toISOString(),
      durationMs: partial.durationMs,
      filePath: partial.filePath ?? undefined,
      language: partial.filePath ? partial.filePath.split('.').pop() || undefined : undefined,
    };
  }

  private enqueue(event: TelemetryEventDto): void {
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
      this.log?.appendLine(`[telemetry] Sending payload: ${JSON.stringify({ events: batch })}`);
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

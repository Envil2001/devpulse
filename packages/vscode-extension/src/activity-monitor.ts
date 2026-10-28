import * as vscode from 'vscode';

import { IntervalTimer, ReschedulableTimer } from './utils/timers.js';
import { isTrackedTextDocument } from './utils/tracked-documents.js';

export type ActivityState = 'active' | 'idle';

export interface ActivityStateChange {
  state: ActivityState;
  changedAt: number;
}

export interface ActivityMonitorOptions {
  idleThresholdMs?: number;
  log?: vscode.LogOutputChannel;
}

const DEFAULT_IDLE_THRESHOLD_MS = 2 * 60 * 1000;
const WINDOW_BLUR_GRACE_MS = 10 * 1000;
const SLEEP_CHECK_INTERVAL_MS = 15 * 1000;
const SLEEP_DRIFT_TOLERANCE = 3;

export class ActivityMonitor implements vscode.Disposable {
  private state: ActivityState;
  private lastSleepCheckAt: number = Date.now();
  private lastActivityAt: number = Date.now();
  private blurredAt: number | null = null;
  private stopped = false;

  private readonly disposables: Array<vscode.Disposable> = [];
  private readonly emitter = new vscode.EventEmitter<ActivityStateChange>();

  private readonly idleThresholdMs: number;
  private readonly log?: vscode.LogOutputChannel;

  private readonly idleTimer: ReschedulableTimer;
  private readonly blurTimer: ReschedulableTimer;
  private readonly sleepCheckTimer: IntervalTimer;

  readonly onDidChangeActivityState = this.emitter.event;

  constructor(options: ActivityMonitorOptions = {}) {
    this.idleThresholdMs = options.idleThresholdMs ?? DEFAULT_IDLE_THRESHOLD_MS;
    this.log = options.log;

    this.idleTimer = new ReschedulableTimer(() => {
      this.transitionToIdle(this.lastActivityAt);
    });

    this.blurTimer = new ReschedulableTimer(() => {
      // blurredAt is always set before scheduling; fall back defensively.
      this.transitionToIdle(this.blurredAt ?? this.lastActivityAt);
    });

    this.sleepCheckTimer = new IntervalTimer(() => {
      this.checkSleepDrift();
    });

    this.state = vscode.window.state.focused ? 'active' : 'idle';

    this.registerListeners();
    this.sleepCheckTimer.start(SLEEP_CHECK_INTERVAL_MS);

    if (this.state === 'active') {
      this.scheduleIdleTransition();
    }
  }

  get currentState(): ActivityState {
    return this.state;
  }

  private registerListeners(): void {
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (!isTrackedTextDocument(event.document) || event.contentChanges.length === 0) return;
        this.pulseActivity();
      }),
      vscode.workspace.onDidChangeNotebookDocument((event) => {
        if (event.cellChanges.length === 0 && event.contentChanges.length === 0) return;
        this.pulseActivity();
      }),
      vscode.window.onDidChangeTextEditorSelection((event) => {
        if (!isTrackedTextDocument(event.textEditor.document)) return;
        this.pulseActivity();
      }),
      vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
        if (!isTrackedTextDocument(event.textEditor.document)) return;
        this.pulseActivity();
      }),
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor === undefined) {
          this.scheduleIdleTransition();
          return;
        }
        if (!isTrackedTextDocument(editor.document)) return;
        this.pulseActivity();
      }),
      vscode.window.onDidChangeWindowState((windowState) => {
        if (windowState.focused) {
          this.pulseActivity();
        } else {
          this.idleTimer.cancel();
          this.blurredAt = Date.now();
          this.scheduleBlurIdleTransition();
        }
      }),
      vscode.window.onDidChangeActiveTerminal((terminal) => {
        if (terminal === undefined) return;
        this.pulseActivity();
      }),
      vscode.window.onDidOpenTerminal(() => {
        this.pulseActivity();
      }),
      vscode.tasks.onDidStartTask(() => {
        this.pulseActivity();
      }),
      vscode.debug.onDidStartDebugSession(() => {
        this.pulseActivity();
      }),
      vscode.debug.onDidChangeBreakpoints(() => {
        this.pulseActivity();
      }),
      vscode.workspace.onDidCreateFiles(() => {
        this.pulseActivity();
      }),
      vscode.workspace.onDidDeleteFiles(() => {
        this.pulseActivity();
      }),
      vscode.workspace.onDidRenameFiles(() => {
        this.pulseActivity();
      }),
    );

    const w = vscode.window as typeof vscode.window & {
      onDidStartTerminalShellExecution?: (listener: () => unknown) => vscode.Disposable;
    };
    if (typeof w.onDidStartTerminalShellExecution === 'function') {
      this.disposables.push(
        w.onDidStartTerminalShellExecution(() => {
          this.pulseActivity();
        }),
      );
    }
  }

  private pulseActivity(): void {
    this.blurTimer.cancel();
    this.blurredAt = null;
    this.lastActivityAt = Date.now();

    if (this.state === 'idle') {
      this.transitionToActive();
    }
    this.scheduleIdleTransition();
  }

  private scheduleIdleTransition(): void {
    this.idleTimer.schedule(this.idleThresholdMs);
  }

  private scheduleBlurIdleTransition(): void {
    this.blurTimer.schedule(WINDOW_BLUR_GRACE_MS);
  }

  private checkSleepDrift(): void {
    const now = Date.now();
    const previousCheckpoint = this.lastSleepCheckAt;
    const elapsed = now - previousCheckpoint;
    this.lastSleepCheckAt = now;

    if (elapsed <= SLEEP_CHECK_INTERVAL_MS * SLEEP_DRIFT_TOLERANCE) {
      return;
    }

    if (this.lastActivityAt > previousCheckpoint) {
      return;
    }

    const sleptSeconds = Math.round((elapsed - SLEEP_CHECK_INTERVAL_MS) / 1000);
    this.log?.warn(`system sleep detected, ~${String(sleptSeconds)}s`);

    this.idleTimer.cancel();
    this.blurTimer.cancel();

    this.transitionToIdle(this.blurredAt ?? this.lastActivityAt);
  }

  private transitionToActive(): void {
    if (this.stopped) return;
    if (this.state === 'active') return;

    this.state = 'active';
    this.log?.info('active');

    this.emitter.fire({ state: 'active', changedAt: Date.now() });
  }

  private transitionToIdle(anchor: number): void {
    if (this.stopped) return;
    if (this.state === 'idle') return;

    this.state = 'idle';
    this.log?.info(`idle (anchor=${String(anchor)})`);

    this.emitter.fire({ state: 'idle', changedAt: anchor });
  }

  dispose(): void {
    this.stopped = true;

    for (const d of this.disposables) {
      d.dispose();
    }

    this.idleTimer.cancel();
    this.blurTimer.cancel();
    this.sleepCheckTimer.stop();

    this.emitter.dispose();
  }
}

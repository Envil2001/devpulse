import * as vscode from 'vscode';

import { IntervalTimer, ReschedulableTimer } from './utils/timers.js';

export type ActivityState = 'active' | 'idle';

export interface ActivityStateChange {
  state: ActivityState;
  changedAt: number;
}

const DEFAULT_IDLE_THRESHOLD_MS = 2 * 60 * 1000;

const WINDOW_BLUR_GRACE_MS = 10 * 1000;

const SLEEP_CHECK_INTERVAL_MS = 15 * 1000;

const SLEEP_DRIFT_TOLERANCE = 3;

function isTrackedTextDocument(document: vscode.TextDocument): boolean {
  if (document.isClosed) {
    return false;
  }
  const { scheme } = document.uri;
  return scheme === 'file' || scheme === 'untitled';
}

export class ActivityMonitor implements vscode.Disposable {
  private state: ActivityState;
  private lastSleepCheckAt: number = Date.now();
  private stopped = false;

  private readonly disposables: Array<vscode.Disposable> = [];
  private readonly emitter = new vscode.EventEmitter<ActivityStateChange>();

  private readonly idleTimer: ReschedulableTimer;
  private readonly blurTimer: ReschedulableTimer;
  private readonly sleepCheckTimer: IntervalTimer;

  readonly onDidChangeActivityState = this.emitter.event;

  constructor(
    private readonly idleThresholdMs: number = DEFAULT_IDLE_THRESHOLD_MS,
    private readonly log?: vscode.LogOutputChannel,
  ) {
    this.idleTimer = new ReschedulableTimer(() => {
      this.transitionTo('idle');
    });

    this.blurTimer = new ReschedulableTimer(() => {
      this.transitionTo('idle');
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
  }

  private pulseActivity(): void {
    this.blurTimer.cancel();
    if (this.state === 'idle') {
      this.transitionTo('active');
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

    const sleptSeconds = Math.round((elapsed - SLEEP_CHECK_INTERVAL_MS) / 1000);
    this.log?.warn(`system sleep detected, ~${String(sleptSeconds)}s`);

    this.idleTimer.cancel();
    this.blurTimer.cancel();

    this.transitionTo('idle', previousCheckpoint);
  }

  private transitionTo(next: ActivityState, changedAt: number = Date.now()): void {
    if (this.stopped) return;
    if (this.state === next) return;

    this.state = next;
    this.log?.info(next);

    this.emitter.fire({ state: next, changedAt });
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

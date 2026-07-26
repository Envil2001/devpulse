import * as vscode from 'vscode';

export type ActivityState = 'active' | 'idle';

export interface ActivityStateChange {
  state: ActivityState;
  changedAt: number;
}

const DEFAULT_IDLE_THRESHOLD_MS = 120_000;

const WINDOW_BLUR_GRACE_MS = 10_000;

const SLEEP_CHECK_INTERVAL_MS = 15_000;

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
  private idleTimer: ReturnType<typeof setTimeout> | undefined;
  private blurTimer: ReturnType<typeof setTimeout> | undefined;
  private sleepCheckTimer: ReturnType<typeof setInterval> | undefined;
  private lastSleepCheckAt: number = Date.now();
  private readonly disposables: Array<vscode.Disposable> = [];

  private readonly emitter = new vscode.EventEmitter<ActivityStateChange>();

  readonly onDidChangeActivityState = this.emitter.event;

  constructor(
    private readonly idleThresholdMs: number = DEFAULT_IDLE_THRESHOLD_MS,
    private readonly log?: vscode.OutputChannel,
  ) {
    this.state = vscode.window.state.focused ? 'active' : 'idle';

    this.registerListeners();

    this.startSleepDetection();

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
        if (editor === undefined || !isTrackedTextDocument(editor.document)) return;
        this.pulseActivity();
      }),
      vscode.window.onDidChangeWindowState((windowState) => {
        if (windowState.focused) {
          this.pulseActivity();
        } else {
          this.clearIdleTimer();
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
    this.clearBlurTimer();
    if (this.state === 'idle') {
      this.transitionTo('active');
    }
    this.scheduleIdleTransition();
  }

  private scheduleIdleTransition(): void {
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => {
      this.idleTimer = undefined;
      this.transitionTo('idle');
    }, this.idleThresholdMs);
  }

  private clearIdleTimer(): void {
    if (this.idleTimer !== undefined) {
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }
  }

  private scheduleBlurIdleTransition(): void {
    this.clearBlurTimer();

    this.blurTimer = setTimeout(() => {
      this.blurTimer = undefined;
      this.transitionTo('idle');
    }, WINDOW_BLUR_GRACE_MS);
  }

  private clearBlurTimer(): void {
    if (this.blurTimer !== undefined) {
      clearTimeout(this.blurTimer);
      this.blurTimer = undefined;
    }
  }

  private startSleepDetection(): void {
    this.lastSleepCheckAt = Date.now();

    this.sleepCheckTimer = setInterval(() => {
      const now = Date.now();
      const previousCheckpoint = this.lastSleepCheckAt;
      const elapsed = now - previousCheckpoint;
      this.lastSleepCheckAt = now;

      if (elapsed > SLEEP_CHECK_INTERVAL_MS * SLEEP_DRIFT_TOLERANCE) {
        const sleptSeconds = Math.round((elapsed - SLEEP_CHECK_INTERVAL_MS) / 1000);
        this.log?.appendLine(`[activity] system sleep detected, ~${String(sleptSeconds)}s`);

        this.clearIdleTimer();
        this.clearBlurTimer();

        this.transitionTo('idle', previousCheckpoint);
      }
    }, SLEEP_CHECK_INTERVAL_MS);
  }

  private clearSleepCheckTimer(): void {
    if (this.sleepCheckTimer !== undefined) {
      clearInterval(this.sleepCheckTimer);
      this.sleepCheckTimer = undefined;
    }
  }

  private transitionTo(next: ActivityState, changedAt: number = Date.now()): void {
    if (this.state === next) return;

    this.state = next;
    this.log?.appendLine(`[activity] ${next}`);
    this.emitter.fire({ state: next, changedAt });
  }

  dispose(): void {
    this.clearIdleTimer();
    this.clearBlurTimer();
    this.clearSleepCheckTimer();
    this.emitter.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}

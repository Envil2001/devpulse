import * as vscode from 'vscode';

export type ActivityState = 'active' | 'idle';

/** Time without editor/window signals before we consider the user idle (no new keystrokes in the host). */
const DEFAULT_IDLE_THRESHOLD_MS = 120_000;

function isTrackedTextDocument(document: vscode.TextDocument): boolean {
  if (document.isClosed) {
    return false;
  }
  const { scheme } = document.uri;
  return scheme === 'file' || scheme === 'untitled';
}

/**
 * Infers "coding activity" from VS Code editor/window events. Raw OS keyboard/mouse hooks are not
 * available to extensions; this is the standard approach for IDE-bound activity vs idle.
 */
export class ActivityMonitor implements vscode.Disposable {
  private state: ActivityState;
  private idleTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly disposables: Array<vscode.Disposable> = [];
  private readonly emitter = new vscode.EventEmitter<ActivityState>();

  readonly onDidChangeActivityState = this.emitter.event;

  constructor(
    private readonly idleThresholdMs: number = DEFAULT_IDLE_THRESHOLD_MS,
    private readonly log?: vscode.OutputChannel,
  ) {
    this.state = vscode.window.state.focused ? 'active' : 'idle';
    this.registerListeners();
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
        if (!isTrackedTextDocument(event.document) || event.contentChanges.length === 0) {
          return;
        }
        this.pulseActivity();
      }),
      vscode.window.onDidChangeTextEditorSelection((event) => {
        if (!isTrackedTextDocument(event.textEditor.document)) {
          return;
        }
        this.pulseActivity();
      }),
      vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
        if (!isTrackedTextDocument(event.textEditor.document)) {
          return;
        }
        this.pulseActivity();
      }),
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor === undefined || !isTrackedTextDocument(editor.document)) {
          return;
        }
        this.pulseActivity();
      }),
      vscode.window.onDidChangeWindowState((windowState) => {
        if (windowState.focused) {
          this.pulseActivity();
        } else {
          this.clearIdleTimer();
          this.transitionTo('idle');
        }
      }),
    );
  }

  private pulseActivity(): void {
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

  private transitionTo(next: ActivityState): void {
    if (this.state === next) {
      return;
    }
    this.state = next;
    this.log?.appendLine(`[activity] ${next}`);
    this.emitter.fire(next);
  }

  dispose(): void {
    this.clearIdleTimer();
    this.emitter.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}

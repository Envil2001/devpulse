import * as vscode from 'vscode';

export interface TerminalCommandEvent {
  command: string;
  cwd: string | null;
  exitCode: number | null;
  durationMs: number;
}

export class TerminalMonitor implements vscode.Disposable {
  private readonly disposables: Array<vscode.Disposable> = [];
  private readonly emitter = new vscode.EventEmitter<TerminalCommandEvent>();

  private readonly startedAt = new Map<vscode.TerminalShellExecution, number>();

  readonly onDidRunCommand = this.emitter.event;

  constructor(private readonly log?: vscode.OutputChannel) {
    this.disposables.push(
      vscode.window.onDidStartTerminalShellExecution((event) => {
        this.onStart(event);
      }),

      vscode.window.onDidEndTerminalShellExecution((event) => {
        this.onEnd(event);
      }),
    );
  }

  private onStart(event: vscode.TerminalShellExecutionStartEvent): void {
    const command = event.execution.commandLine.value.trim();
    if (!command) return;

    this.startedAt.set(event.execution, Date.now());
    this.log?.appendLine(`[terminal] started: ${command}`);
  }

  private onEnd(event: vscode.TerminalShellExecutionEndEvent): void {
    const command = event.execution.commandLine.value.trim();
    if (!command) return;

    const finishedAt = Date.now();

    const startedAt = this.startedAt.get(event.execution) ?? finishedAt;

    this.startedAt.delete(event.execution);

    const durationMs = Math.max(0, finishedAt - startedAt);

    const cwd = event.execution.cwd?.fsPath ?? null;

    this.log?.appendLine(
      `[terminal] finished: ${command} (exit=${String(event.exitCode ?? 'n/a')}, ${String(durationMs)}ms)`,
    );

    this.emitter.fire({
      command,
      cwd,
      exitCode: event.exitCode ?? null,
      durationMs,
    });
  }

  public dispose(): void {
    this.emitter.dispose();
    this.startedAt.clear();
    for (const d of this.disposables) d.dispose();
  }
}

import * as vscode from 'vscode';

export interface TaskRunEvent {
  name: string;
  source: string;
  exitCode: number | null;
  durationMs: number;
}

export class TasksMonitor implements vscode.Disposable {
  private readonly disposables: Array<vscode.Disposable> = [];
  private readonly emitter = new vscode.EventEmitter<TaskRunEvent>();

  private readonly startedAt = new Map<vscode.TaskExecution, number>();

  private readonly exitCodes = new Map<vscode.TaskExecution, number | null>();

  readonly onDidRunTask = this.emitter.event;

  constructor(private readonly log?: vscode.OutputChannel) {
    this.disposables.push(
      vscode.tasks.onDidStartTask((event) => {
        this.startedAt.set(event.execution, Date.now());
        this.log?.appendLine(`[task] started: ${event.execution.task.name}`);
      }),

      vscode.tasks.onDidEndTaskProcess((event) => {
        this.exitCodes.set(event.execution, event.exitCode ?? null);
      }),

      vscode.tasks.onDidEndTask((event) => {
        this.onEnd(event.execution);
      }),
    );
  }

  private onEnd(execution: vscode.TaskExecution): void {
    const startedAt = this.startedAt.get(execution);
    const exitCode = this.exitCodes.get(execution) ?? null;

    this.startedAt.delete(execution);
    this.exitCodes.delete(execution);

    if (startedAt === undefined) return;

    const { task } = execution;
    const durationMs = Math.max(0, Date.now() - startedAt);

    this.log?.appendLine(
      `[task] finished: ${task.name} (exit=${String(exitCode ?? 'n/a')}, ${String(durationMs)}ms)`,
    );

    this.emitter.fire({
      name: task.name,
      source: task.source,
      exitCode,
      durationMs,
    });
  }

  public dispose(): void {
    this.emitter.dispose();
    this.startedAt.clear();
    this.exitCodes.clear();
    for (const d of this.disposables) d.dispose();
  }
}

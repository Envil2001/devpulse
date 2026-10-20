import * as vscode from 'vscode';

export interface TodayStats {
  activeSeconds: number;
  focusScore: number;
  sessionsCount: number;
}

export type HealthStatus = 'ok' | 'invalid-key' | 'offline' | 'error';
export class StatusBarState implements vscode.Disposable {
  private isPausedValue = false;
  private todayStatsValue: TodayStats | null = null;
  private healthValue: HealthStatus = 'ok';

  private readonly emitter = new vscode.EventEmitter<void>();
  readonly onDidChange = this.emitter.event;

  get isPaused(): boolean {
    return this.isPausedValue;
  }

  get todayStats(): TodayStats | null {
    return this.todayStatsValue;
  }

  get health(): HealthStatus {
    return this.healthValue;
  }

  setPaused(value: boolean): void {
    if (this.isPausedValue === value) return;
    this.isPausedValue = value;
    this.emitter.fire();
  }

  setTodayStats(value: TodayStats | null): void {
    this.todayStatsValue = value;
    this.emitter.fire();
  }

  setHealth(value: HealthStatus): void {
    if (this.healthValue === value) return;
    this.healthValue = value;
    this.emitter.fire();
  }

  dispose(): void {
    this.emitter.dispose();
  }
}

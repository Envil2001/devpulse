import * as vscode from 'vscode';

import type { GitContext } from '../../git-context.js';

const CONTEXT_LOSS_GRACE_MS = 2 * 60 * 1000;

export type ContextUpdateResult = 'changed' | 'restored' | 'lost' | 'noop';

export class ContextTracker implements vscode.Disposable {
  private branchValue: string | null = null;
  private remoteUrlValue: string | null = null;
  private graceTimer: ReturnType<typeof setTimeout> | undefined;

  private readonly emitter = new vscode.EventEmitter<void>();
  readonly onGracePeriodExpired = this.emitter.event;

  constructor(private readonly log?: vscode.OutputChannel) {}

  get branch(): string | null {
    return this.branchValue;
  }

  get remoteUrl(): string | null {
    return this.remoteUrlValue;
  }

  update(nextContext: GitContext): ContextUpdateResult {
    const nextBranch = nextContext.gitBranch;
    const nextRemoteUrl = nextContext.gitRemoteUrl;

    if (nextBranch === null) {
      this.scheduleGraceTimeout();
      return 'lost';
    }

    const wasInGrace = this.graceTimer !== undefined;
    this.clearGraceTimer();

    if (this.branchValue === nextBranch && this.remoteUrlValue === nextRemoteUrl) {
      return wasInGrace ? 'restored' : 'noop';
    }

    this.branchValue = nextBranch;
    this.remoteUrlValue = nextRemoteUrl;
    return 'changed';
  }

  reset(): void {
    this.clearGraceTimer();
    this.branchValue = null;
    this.remoteUrlValue = null;
  }

  private scheduleGraceTimeout(): void {
    this.clearGraceTimer();

    this.graceTimer = setTimeout(() => {
      this.graceTimer = undefined;

      if (this.branchValue !== null) {
        this.log?.appendLine(
          `[debug] context loss grace expired, ending session on ${this.branchValue}`,
        );
        this.emitter.fire();
      }
    }, CONTEXT_LOSS_GRACE_MS);
  }

  private clearGraceTimer(): void {
    if (this.graceTimer !== undefined) {
      clearTimeout(this.graceTimer);
      this.graceTimer = undefined;
    }
  }

  dispose(): void {
    this.clearGraceTimer();
    this.emitter.dispose();
  }
}

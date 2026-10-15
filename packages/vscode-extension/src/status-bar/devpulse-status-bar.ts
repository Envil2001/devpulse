import * as vscode from 'vscode';

import { formatDuration } from '@devpulse/lib';

import type { GitContextProvider } from '../git-context.js';

import type { StatusBarState, TodayStats } from './status-bar-state.js';

function statusIcon(state: StatusBarState): string {
  if (state.isPaused) return '⏸';
  if (state.health === 'invalid-key' || state.health === 'offline') return '⚠';
  return '🟢';
}

export class DevPulseStatusBar implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem;
  private readonly disposables: Array<vscode.Disposable> = [];

  constructor(
    private readonly gitContextProvider: GitContextProvider,
    private readonly statusBarState: StatusBarState,
  ) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10_000);
    this.item.name = 'DevPulse Status';
    this.item.tooltip = 'DevPulse Status';
    this.item.command = 'devpulse.showMenu';

    this.disposables.push(
      this.gitContextProvider.onDidChangeContext(() => {
        this.render();
      }),
      this.statusBarState.onDidChange(() => {
        this.render();
      }),
    );

    this.render();
  }

  public show(): void {
    this.item.show();
  }

  private render(): void {
    const { workspaceName, gitBranch } = this.gitContextProvider.currentContext;
    const stats = this.statusBarState.todayStats;

    const timeLabel = stats ? formatDuration(stats.activeSeconds) : 'No Time';
    const branchLabel = gitBranch ? `$(git-branch) ${gitBranch}` : 'No Git';

    this.item.text = `⏱ ${timeLabel}  🌿 ${branchLabel}  ${statusIcon(this.statusBarState)}`;
    this.item.tooltip = this.buildTooltip(workspaceName, gitBranch, stats);

    void vscode.commands.executeCommand('setContext', 'devpulse.workspaceName', workspaceName);
    void vscode.commands.executeCommand('setContext', 'devpulse.gitBranch', gitBranch);
    void vscode.commands.executeCommand(
      'setContext',
      'devpulse.trackingPaused',
      this.statusBarState.isPaused,
    );
  }

  private buildTooltip(
    workspaceName: string | null,
    gitBranch: string | null,
    stats: TodayStats | null,
  ): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.supportThemeIcons = true;

    md.appendMarkdown('**DevPulse**\n\n');
    md.appendMarkdown(`Workspace: ${workspaceName ?? 'None'}\n\n`);
    md.appendMarkdown(`Branch: ${gitBranch ?? 'None'}\n\n`);

    if (stats) {
      md.appendMarkdown(`Today: **${formatDuration(stats.activeSeconds)}**\n\n`);
      md.appendMarkdown(`Focus: ${String(stats.focusScore)}%\n\n`);
      md.appendMarkdown(`Sessions: ${String(stats.sessionsCount)}\n\n`);
    } else {
      md.appendMarkdown('No activity recorded today.\n\n');
    }

    md.appendMarkdown(`Status: ${this.statusLabel()}\n\n`);
    md.appendMarkdown('_Click for menu_');

    return md;
  }

  private statusLabel(): string {
    if (this.statusBarState.isPaused) return 'Paused';
    if (this.statusBarState.health === 'invalid-key') return 'Invalid API key';
    if (this.statusBarState.health === 'offline') return 'Offline';
    return 'Active';
  }

  public dispose(): void {
    for (const d of this.disposables) d.dispose();
    this.item.dispose();
  }
}

import * as vscode from 'vscode';

import { type GitContextProvider } from '../git-context.js';

export class GitStatusBar implements vscode.Disposable {
  private readonly statusBarItem: vscode.StatusBarItem;
  private readonly changeSubscription: vscode.Disposable;

  constructor(private readonly gitContextProvider: GitContextProvider) {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10_000);
    this.statusBarItem.name = 'DevPulse Git Status';
    this.statusBarItem.tooltip = 'Current Git Branch';
    this.changeSubscription = this.gitContextProvider.onDidChangeContext(() => {
      void this.render();
    });
  }

  public async show(): Promise<void> {
    this.statusBarItem.show();
    await this.render();
  }

  private async render(): Promise<void> {
    const { workspaceName, gitBranch } = this.gitContextProvider.currentContext;

    const labelWorkspace = workspaceName ?? 'No Workspace';
    const labelBranch = gitBranch ?? 'No Git';
    this.statusBarItem.text = `$(repo) ${labelWorkspace}  $(git-branch) ${labelBranch}`;

    await vscode.commands.executeCommand('setContext', 'devpulse.workspaceName', workspaceName);
    await vscode.commands.executeCommand('setContext', 'devpulse.gitBranch', gitBranch);
  }

  public dispose(): void {
    this.changeSubscription.dispose();
    this.statusBarItem.dispose();
  }
}

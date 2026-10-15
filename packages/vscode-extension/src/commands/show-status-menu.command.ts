import * as vscode from 'vscode';

import type { StatusBarState } from '../status-bar/status-bar-state.js';

interface MenuItem extends vscode.QuickPickItem {
  command: string;
}

export function registerShowStatusMenuCommand(state: StatusBarState): vscode.Disposable {
  return vscode.commands.registerCommand('devpulse.showMenu', async () => {
    const items: Array<MenuItem> = [
      { label: '$(dashboard) Open Dashboard', command: 'devpulse.openDashboard' },
      { label: '$(history) View Sessions', command: 'devpulse.openSessions' },

      { label: '', kind: vscode.QuickPickItemKind.Separator, command: '' },

      state.isPaused
        ? { label: '$(play) Resume Tracking', command: 'devpulse.resumeTracking' }
        : { label: '$(debug-pause) Pause Tracking', command: 'devpulse.pauseTracking' },

      { label: '', kind: vscode.QuickPickItemKind.Separator, command: '' },

      { label: '$(key) Set API Key', command: 'devpulse.setApiKey' },
      { label: '$(trash) Clear API Key', command: 'devpulse.clearApiKey' },

      { label: '', kind: vscode.QuickPickItemKind.Separator, command: '' },

      { label: '$(output) Show Log', command: 'devpulse.showLog' },
      { label: '$(tools) Show Diagnostics', command: 'devpulse.showDiagnostics' },
    ];

    const selected = await vscode.window.showQuickPick(items, {
      title: 'DevPulse',
      placeHolder: 'Choose an action',
    });

    if (selected?.command) {
      void vscode.commands.executeCommand(selected.command);
    }
  });
}

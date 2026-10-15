import * as vscode from 'vscode';

function resolveDashboardUrl(): string {
  const configured = vscode.workspace.getConfiguration('devpulse').get<string>('dashboardUrl');
  return configured?.trim() ?? 'http://localhost:3001';
}

export function registerOpenDashboardCommands(): Array<vscode.Disposable> {
  return [
    vscode.commands.registerCommand('devpulse.openDashboard', async () => {
      const url = resolveDashboardUrl();
      await vscode.env.openExternal(vscode.Uri.parse(url));
    }),

    vscode.commands.registerCommand('devpulse.openSessions', async () => {
      const url = `${resolveDashboardUrl()}/sessions`;
      await vscode.env.openExternal(vscode.Uri.parse(url));
    }),
  ];
}

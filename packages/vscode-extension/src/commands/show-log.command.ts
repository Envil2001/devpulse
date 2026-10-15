import * as vscode from 'vscode';

export function registerShowLogCommand(outputChannel: vscode.LogOutputChannel): vscode.Disposable {
  return vscode.commands.registerCommand('devpulse.showLog', () => {
    outputChannel.show();
  });
}

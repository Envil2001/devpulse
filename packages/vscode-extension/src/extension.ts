import * as vscode from 'vscode';

/**
 * Activated after the workbench has finished starting (`onStartupFinished`), or when the
 * hello-world command runs (`onCommand:...`) if activation was deferred.
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('DevPulse extension is active');

  const disposable = vscode.commands.registerCommand('devpulse.devpulse.helloWorld', () => {
    vscode.window.showInformationMessage('Hello from DevPulse!');
  });

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  /* Extension cleanup hooks will run here in later tasks. */
}

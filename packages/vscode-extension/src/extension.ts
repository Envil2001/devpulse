import * as vscode from 'vscode';

/**
 * Activated after the workbench has finished starting (`onStartupFinished`).
 * Command activation from `contributes.commands` is inferred by VS Code — no duplicate `onCommand` in package.json.
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

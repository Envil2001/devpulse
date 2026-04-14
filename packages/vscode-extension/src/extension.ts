import * as vscode from 'vscode';

import { ActivityMonitor } from './activity-monitor.js';
import { DEVPULSE_API_KEY_SECRET } from './secret-keys.js';

/**
 * Activated after the workbench has finished starting (`onStartupFinished`).
 * Command activation from `contributes.commands` is inferred by VS Code — no duplicate `onCommand` in package.json.
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('DevPulse extension is active');

  const outputChannel = vscode.window.createOutputChannel('DevPulse');
  const activityMonitor = new ActivityMonitor(undefined, outputChannel);

  context.subscriptions.push(
    outputChannel,
    activityMonitor,
    vscode.commands.registerCommand('devpulse.devpulse.helloWorld', () => {
      void vscode.window.showInformationMessage('Hello from DevPulse!');
    }),
    vscode.commands.registerCommand('devpulse.devpulse.setApiKey', async () => {
      const apiKey = await vscode.window.showInputBox({
        title: 'DevPulse API Key',
        prompt:
          'Paste your API key. It is stored only in the OS secret store (VS Code SecretStorage).',
        password: true,
        ignoreFocusOut: true,
        validateInput: (value) => {
          if (!value.trim()) {
            return 'API key cannot be empty';
          }
          return null;
        },
      });

      if (apiKey === undefined) {
        return;
      }

      await context.secrets.store(DEVPULSE_API_KEY_SECRET, apiKey.trim());
      void vscode.window.showInformationMessage('DevPulse API key saved securely.');
    }),
  );
}

export function deactivate(): void {
  /* Extension cleanup hooks will run here in later tasks. */
}

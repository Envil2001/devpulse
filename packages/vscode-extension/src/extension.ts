import * as vscode from 'vscode';

import { TelemetryBridge } from './telemetry/telemetry-bridge.js';
import { ActivityMonitor } from './activity-monitor.js';
import { GitContextProvider } from './git-context.js';
import { DEVPULSE_API_KEY_SECRET } from './secret-keys.js';

/**
 * Activated after the workbench has finished starting (`onStartupFinished`).
 * Command activation from `contributes.commands` is inferred by VS Code — no duplicate `onCommand` in package.json.
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('DevPulse extension is active');

  const outputChannel = vscode.window.createOutputChannel('DevPulse');
  const activityMonitor = new ActivityMonitor(undefined, outputChannel);
  const gitContextProvider = new GitContextProvider(outputChannel);
  const telemetryBridge = new TelemetryBridge(
    context,
    activityMonitor,
    gitContextProvider,
    outputChannel,
  );
  void telemetryBridge.start();

  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBar.name = 'DevPulse Git Context';
  statusBar.tooltip = 'DevPulse: current workspace and Git branch';
  statusBar.show();

  const applyGitContext = async (): Promise<void> => {
    const { workspaceName, gitBranch } = gitContextProvider.currentContext;

    const labelWorkspace = workspaceName ?? 'No Workspace';
    const labelBranch = gitBranch ?? 'No Git';
    statusBar.text = `$(repo) ${labelWorkspace}  $(git-branch) ${labelBranch}`;

    await vscode.commands.executeCommand('setContext', 'devpulse.workspaceName', workspaceName);
    await vscode.commands.executeCommand('setContext', 'devpulse.gitBranch', gitBranch);
  };

  void applyGitContext();

  context.subscriptions.splice(
    context.subscriptions.length,
    0,
    statusBar,
    gitContextProvider.onDidChangeContext(() => {
      void applyGitContext();
    }),
    outputChannel,
    activityMonitor,
    gitContextProvider,
    telemetryBridge,
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

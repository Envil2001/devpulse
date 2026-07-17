import * as vscode from 'vscode';

import { ActivityMonitor } from './activity-monitor.js';
import { registerCommands } from './commands/index.js';
import { GitContextProvider } from './git-context.js';
import { GitStatusBar } from './status-bar/git-status-bar.js';
import { TelemetryBridge } from './telemetry/telemetry-bridge.js';

export function activate(context: vscode.ExtensionContext): void {
  console.log('DevPulse extension is now active!');

  const outputChannel = vscode.window.createOutputChannel('DevPulse');
  const activityMonitor = new ActivityMonitor();
  const gitContextProvider = new GitContextProvider();
  const telemetryBridge = new TelemetryBridge(
    context,
    activityMonitor,
    gitContextProvider,
    outputChannel,
  );

  void telemetryBridge.start();

  const gitStatusBar = new GitStatusBar(gitContextProvider);

  void gitStatusBar.show();

  context.subscriptions.push(
    outputChannel,
    activityMonitor,
    gitContextProvider,
    telemetryBridge,
    gitStatusBar,
    ...registerCommands(context),
  );
}

export function deactivate(): void {
  /* Extension cleanup hooks will run here in later tasks. */
}

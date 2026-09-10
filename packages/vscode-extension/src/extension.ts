import * as vscode from 'vscode';

import { registerCommands } from './commands/index.js';
import { GitStatusBar } from './status-bar/git-status-bar.js';
import { TelemetryBridge } from './telemetry/telemetry-bridge.js';
import { ActivityMonitor } from './activity-monitor.js';
import { GitContextProvider } from './git-context.js';

let telemetryBridge: TelemetryBridge | undefined;

export function activate(context: vscode.ExtensionContext): void {
  console.log('DevPulse extension is now active!');

  const outputChannel = vscode.window.createOutputChannel('DevPulse');

  context.subscriptions.push(outputChannel, ...registerCommands(context));

  let isTelemetryStarted = false;

  const startTelemetry = (): void => {
    if (isTelemetryStarted) {
      return;
    }

    isTelemetryStarted = true;

    const activityMonitor = new ActivityMonitor();
    const gitContextProvider = new GitContextProvider();

    telemetryBridge = new TelemetryBridge(
      context,
      activityMonitor,
      gitContextProvider,
      outputChannel,
    );

    telemetryBridge.start().catch((error: unknown) => {
      outputChannel.appendLine(`[error] Telemetry failed to start: ${String(error)}`);
    });

    const gitStatusBar = new GitStatusBar(gitContextProvider);
    void gitStatusBar.show();

    context.subscriptions.push(activityMonitor, gitContextProvider, telemetryBridge, gitStatusBar);

    outputChannel.appendLine('[info] Workspace is trusted. Telemetry started.');
  };

  if (vscode.workspace.isTrusted) {
    startTelemetry();
  } else {
    outputChannel.appendLine(
      '[warn] Workspace is UNTRUSTED. Telemetry is paused to protect your data.',
    );

    context.subscriptions.push(
      vscode.workspace.onDidGrantWorkspaceTrust(() => {
        startTelemetry();
      }),
    );
  }
}

export async function deactivate(): Promise<void> {
  try {
    await telemetryBridge?.flush();
  } catch {
    // shutting down, nothing to do
  }
}

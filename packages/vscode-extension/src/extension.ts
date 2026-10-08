import * as vscode from 'vscode';

import { registerCommands } from './commands/index.js';
import { GitStatusBar } from './status-bar/git-status-bar.js';
import { TelemetryBridge } from './telemetry/telemetry-bridge.js';
import { ActivityMonitor } from './activity-monitor.js';
import { GitContextProvider } from './git-context.js';

let telemetryBridge: TelemetryBridge | undefined;
const DEACTIVATE_FLUSH_TIMEOUT_MS = 3000;

function canStartTelemetry(): boolean {
  return vscode.workspace.isTrusted && vscode.env.isTelemetryEnabled;
}

export function activate(context: vscode.ExtensionContext): void {
  console.log('DevPulse extension is now active!');

  const outputChannel = vscode.window.createOutputChannel('DevPulse', { log: true });
  context.subscriptions.push(outputChannel, ...registerCommands(context));

  let isTelemetryStarted = false;

  const startTelemetry = (): void => {
    if (isTelemetryStarted) return;
    isTelemetryStarted = true;

    const activityMonitor = new ActivityMonitor();
    const gitContextProvider = new GitContextProvider();

    telemetryBridge = new TelemetryBridge(
      context,
      activityMonitor,
      gitContextProvider,
      outputChannel,
    );

    const gitStatusBar = new GitStatusBar(gitContextProvider);

    context.subscriptions.push(activityMonitor, gitContextProvider, telemetryBridge, gitStatusBar);

    void gitStatusBar.show();

    telemetryBridge.start().catch((error: unknown) => {
      outputChannel.error(`Telemetry failed to start: ${String(error)}`);
    });

    outputChannel.info('Telemetry started.');
  };

  const stopTelemetry = (): void => {
    if (!telemetryBridge || !isTelemetryStarted) return;
    telemetryBridge.stop();
    isTelemetryStarted = false;
    outputChannel.warn('VS Code telemetry disabled. DevPulse stopped.');
  };

  context.subscriptions.push(
    vscode.env.onDidChangeTelemetryEnabled((enabled) => {
      if (!enabled) {
        stopTelemetry();
      } else if (vscode.workspace.isTrusted) {
        startTelemetry();
      }
    }),
  );

  if (canStartTelemetry()) {
    startTelemetry();
  } else {
    outputChannel.warn('Telemetry is paused (untrusted workspace or VS Code telemetry disabled).');

    context.subscriptions.push(
      vscode.workspace.onDidGrantWorkspaceTrust(() => {
        if (canStartTelemetry()) {
          startTelemetry();
        }
      }),
    );
  }
}

export async function deactivate(): Promise<void> {
  if (!telemetryBridge) return;

  telemetryBridge.stop();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, DEACTIVATE_FLUSH_TIMEOUT_MS);

  try {
    await telemetryBridge.flush(controller.signal);
  } catch {
    // shutting down, best effort
  } finally {
    clearTimeout(timeoutId);
  }
}

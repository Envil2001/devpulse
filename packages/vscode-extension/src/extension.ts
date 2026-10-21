import * as vscode from 'vscode';

import { registerCommands } from './commands/index.js';
import { AiMonitor } from './signals/ai-monitor.js';
import { GitCommitWatcher } from './signals/git-commit-watcher.js';
import { TasksMonitor } from './signals/tasks-monitor.js';
import { TerminalMonitor } from './signals/terminal-monitor.js';
import { DevPulseStatusBar } from './status-bar/devpulse-status-bar.js';
import { StatsPoller } from './status-bar/stats-poller.js';
import { StatusBarState } from './status-bar/status-bar-state.js';
import { TelemetryApiClient } from './telemetry/api-client.js';
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
  const state = new StatusBarState();
  context.subscriptions.push(outputChannel, state);

  const initialSubscriptions: Array<vscode.Disposable> = [
    outputChannel,
    state,
    ...registerCommands(context, { state, getBridge: () => telemetryBridge, outputChannel }),
  ];
  context.subscriptions.push(...initialSubscriptions);

  const gitContextProvider = new GitContextProvider();
  const statusBar = new DevPulseStatusBar(gitContextProvider, state);
  context.subscriptions.push(gitContextProvider, statusBar);
  statusBar.show();

  const apiClient = new TelemetryApiClient(context, outputChannel);
  const statsPoller = new StatsPoller(apiClient, state, outputChannel);
  context.subscriptions.push(statsPoller);

  let isTelemetryStarted = false;

  const startTelemetry = (): void => {
    if (isTelemetryStarted) return;
    isTelemetryStarted = true;

    const activityMonitor = new ActivityMonitor();
    const taskMonitor = new TasksMonitor(outputChannel);
    const terminalMonitor = new TerminalMonitor(outputChannel);
    const gitCommitWatcher = new GitCommitWatcher(outputChannel);
    const aiMonitor = new AiMonitor(outputChannel);

    telemetryBridge = new TelemetryBridge(
      context,
      activityMonitor,
      aiMonitor,
      gitContextProvider,
      terminalMonitor,
      taskMonitor,
      gitCommitWatcher,
      state,
      outputChannel,
    );

    if (state.isPaused) {
      telemetryBridge.pause();
    }

    context.subscriptions.push(
      activityMonitor,
      telemetryBridge,
      terminalMonitor,
      taskMonitor,
      gitCommitWatcher,
    );

    telemetryBridge.start().catch((error: unknown) => {
      outputChannel.error(`Telemetry failed to start: ${String(error)}`);
    });

    statsPoller.start();

    outputChannel.info('Telemetry started.');
  };

  const stopTelemetry = (): void => {
    if (!telemetryBridge || !isTelemetryStarted) return;
    telemetryBridge.stop();
    statsPoller.stop();
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, DEACTIVATE_FLUSH_TIMEOUT_MS);

  try {
    await telemetryBridge.shutdown(controller.signal);
  } catch {
    // shutting down, best effort
  } finally {
    clearTimeout(timeoutId);
  }
}

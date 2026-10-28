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

const DEACTIVATE_FLUSH_TIMEOUT_MS = 3000;

interface TelemetrySession extends vscode.Disposable {
  readonly bridge: TelemetryBridge;
}

let session: TelemetrySession | undefined;

function canStartTelemetry(): boolean {
  return vscode.workspace.isTrusted && vscode.env.isTelemetryEnabled;
}

export function activate(context: vscode.ExtensionContext): void {
  const outputChannel = vscode.window.createOutputChannel('DevPulse', { log: true });
  const state = new StatusBarState();
  context.subscriptions.push(outputChannel, state);

  outputChannel.info('DevPulse extension is now active.');

  context.subscriptions.push(
    ...registerCommands(context, {
      state,
      getBridge: () => session?.bridge,
      outputChannel,
    }),
  );

  const gitContextProvider = new GitContextProvider(outputChannel);
  const statusBar = new DevPulseStatusBar(gitContextProvider, state);
  context.subscriptions.push(gitContextProvider, statusBar);
  statusBar.show();

  const apiClient = new TelemetryApiClient(context, outputChannel);
  const statsPoller = new StatsPoller(apiClient, state, outputChannel);
  context.subscriptions.push(statsPoller);

  const startTelemetry = (): void => {
    if (session) return;
    if (!canStartTelemetry()) return;

    const activityMonitor = new ActivityMonitor({ log: outputChannel });
    const taskMonitor = new TasksMonitor(outputChannel);
    const terminalMonitor = new TerminalMonitor(outputChannel);
    const gitCommitWatcher = new GitCommitWatcher(outputChannel);
    const aiMonitor = new AiMonitor(outputChannel);

    const bridge = new TelemetryBridge(
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
      bridge.pause();
    }

    const owned = vscode.Disposable.from(
      activityMonitor,
      terminalMonitor,
      taskMonitor,
      gitCommitWatcher,
      aiMonitor,
      bridge,
      {
        dispose: () => {
          statsPoller.stop();
        },
      },
    );

    session = {
      bridge,
      dispose: () => {
        owned.dispose();
      },
    };

    bridge.start().catch((error: unknown) => {
      outputChannel.error(`Telemetry failed to start: ${String(error)}`);
      stopTelemetry();
    });

    try {
      statsPoller.start();
    } catch (error: unknown) {
      outputChannel.error(`StatsPoller.start failed: ${String(error)}`);
      stopTelemetry();
      return;
    }

    outputChannel.info('Telemetry started.');
  };

  const stopTelemetry = (): void => {
    const current = session;
    session = undefined;
    if (!current) return;

    outputChannel.warn('Telemetry stopping (telemetry disabled or workspace untrusted).');

    try {
      current.bridge.stop();
    } catch (error: unknown) {
      outputChannel.error(`TelemetryBridge.stop failed: ${String(error)}`);
    } finally {
      try {
        current.dispose();
      } catch (error: unknown) {
        outputChannel.error(`TelemetrySession.dispose failed: ${String(error)}`);
      }
    }
  };

  const reconcile = (): void => {
    if (canStartTelemetry()) {
      startTelemetry();
    } else {
      stopTelemetry();
    }
  };

  context.subscriptions.push(
    vscode.env.onDidChangeTelemetryEnabled(() => {
      reconcile();
    }),
    vscode.workspace.onDidGrantWorkspaceTrust(() => {
      reconcile();
    }),
  );

  reconcile();
}

export async function deactivate(): Promise<void> {
  const current = session;
  session = undefined;

  if (!current) return;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, DEACTIVATE_FLUSH_TIMEOUT_MS);

  try {
    await current.bridge.shutdown(controller.signal);
  } catch (error: unknown) {
    console.warn('DevPulse shutdown error:', error);
  } finally {
    clearTimeout(timeoutId);
    try {
      current.dispose();
    } catch {
      // best effort during shutdown
    }
  }
}

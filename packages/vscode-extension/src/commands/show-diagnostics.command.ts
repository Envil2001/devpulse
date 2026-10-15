import * as vscode from 'vscode';

import { DEVPULSE_API_KEY_SECRET } from '../secret-keys.js';
import type { StatusBarState } from '../status-bar/status-bar-state.js';

export function registerShowDiagnosticsCommand(
  context: vscode.ExtensionContext,
  outputChannel: vscode.LogOutputChannel,
  state: StatusBarState,
): vscode.Disposable {
  return vscode.commands.registerCommand('devpulse.showDiagnostics', async () => {
    outputChannel.show();

    const key = await context.secrets.get(DEVPULSE_API_KEY_SECRET);
    const config = vscode.workspace.getConfiguration('devpulse');
    const apiUrl = config.get<string>('apiUrl');
    const dashboardUrl = config.get<string>('dashboardUrl');

    const keyLabel = key ? `present (${key.slice(0, 12)}…${key.slice(-4)})` : 'missing';

    outputChannel.info('───────────── DevPulse Diagnostics ─────────────');
    outputChannel.info(`Version: ${String(context.extension.packageJSON.version)}`);
    outputChannel.info(`API URL: ${apiUrl ?? '(env fallback)'}`);
    outputChannel.info(`Dashboard URL: ${dashboardUrl ?? '(default)'}`);
    outputChannel.info(`API key: ${keyLabel}`);
    outputChannel.info(`Workspace trusted: ${String(vscode.workspace.isTrusted)}`);
    outputChannel.info(
      `VS Code telemetry: ${vscode.env.isTelemetryEnabled ? 'enabled' : 'disabled'}`,
    );
    outputChannel.info(`Tracking paused: ${String(state.isPaused)}`);
    outputChannel.info(`Health: ${state.health}`);
    outputChannel.info(`Machine ID: ${vscode.env.machineId}`);
    outputChannel.info(`Session ID: ${vscode.env.sessionId}`);
    outputChannel.info('────────────────────────────────────────────────');
  });
}

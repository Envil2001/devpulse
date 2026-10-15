import type * as vscode from 'vscode';

import type { StatusBarState } from '../status-bar/status-bar-state.js';
import type { TelemetryBridge } from '../telemetry/telemetry-bridge.js';

import { registerClearApiKeyCommand } from './clear-api-key.command.js';
import { registerHelloWorldCommand } from './hello-world.command.js';
import { registerOpenDashboardCommands } from './open-dashboard.command.js';
import { registerPauseTrackingCommand } from './pause-tracking.command.js';
import { registerResumeTrackingCommand } from './resume-tracking.command.js';
import { registerSetApiKeyCommand } from './set-api-key.command.js';
import { registerShowDiagnosticsCommand } from './show-diagnostics.command.js';
import { registerShowLogCommand } from './show-log.command.js';
import { registerShowStatusMenuCommand } from './show-status-menu.command.js';

interface CommandDependencies {
  state: StatusBarState;
  getBridge: () => TelemetryBridge | undefined;
  outputChannel: vscode.LogOutputChannel;
}

export function registerCommands(
  context: vscode.ExtensionContext,
  deps: CommandDependencies,
): Array<vscode.Disposable> {
  return [
    registerHelloWorldCommand(),
    registerSetApiKeyCommand(context),
    registerClearApiKeyCommand(context),

    registerShowStatusMenuCommand(deps.state),
    registerPauseTrackingCommand(deps.state, deps.getBridge),
    registerResumeTrackingCommand(deps.state, deps.getBridge),
    registerShowLogCommand(deps.outputChannel),
    registerShowDiagnosticsCommand(context, deps.outputChannel, deps.state),
    ...registerOpenDashboardCommands(),
  ];
}

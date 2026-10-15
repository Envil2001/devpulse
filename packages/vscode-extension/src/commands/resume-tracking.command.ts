import * as vscode from 'vscode';

import type { StatusBarState } from '../status-bar/status-bar-state.js';
import type { TelemetryBridge } from '../telemetry/telemetry-bridge.js';

export function registerResumeTrackingCommand(
  state: StatusBarState,
  getBridge: () => TelemetryBridge | undefined,
): vscode.Disposable {
  return vscode.commands.registerCommand('devpulse.resumeTracking', () => {
    if (!state.isPaused) return;

    state.setPaused(false);
    getBridge()?.resume();

    void vscode.window.showInformationMessage('DevPulse: tracking resumed.');
  });
}

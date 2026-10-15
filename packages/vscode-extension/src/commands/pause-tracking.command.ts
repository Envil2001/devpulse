import * as vscode from 'vscode';

import type { StatusBarState } from '../status-bar/status-bar-state.js';
import type { TelemetryBridge } from '../telemetry/telemetry-bridge.js';

export function registerPauseTrackingCommand(
  state: StatusBarState,
  getBridge: () => TelemetryBridge | undefined,
): vscode.Disposable {
  return vscode.commands.registerCommand('devpulse.pauseTracking', () => {
    if (state.isPaused) return;

    state.setPaused(true);
    getBridge()?.pause();

    void vscode.window.showInformationMessage('DevPulse: tracking paused.');
  });
}

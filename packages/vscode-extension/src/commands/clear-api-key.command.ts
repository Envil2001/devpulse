import * as vscode from 'vscode';

import { DEVPULSE_API_KEY_SECRET } from '../secret-keys.js';
import type { StatusBarState } from '../status-bar/status-bar-state.js';

const COMMAND_ID = 'devpulse.clearApiKey';

export function registerClearApiKeyCommand(
  context: vscode.ExtensionContext,
  state: StatusBarState,
): vscode.Disposable {
  return vscode.commands.registerCommand(COMMAND_ID, async () => {
    await context.secrets.delete(DEVPULSE_API_KEY_SECRET);
    state.setHealth('missing-key');

    void vscode.window.showInformationMessage('DevPulse API key cleared');
  });
}

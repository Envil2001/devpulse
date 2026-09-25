import * as vscode from 'vscode';

import { DEVPULSE_API_KEY_SECRET } from '../secret-keys.js';

const COMMAND_ID = 'devpulse.clearApiKey';

export function registerClearApiKeyCommand(context: vscode.ExtensionContext): vscode.Disposable {
  return vscode.commands.registerCommand(COMMAND_ID, async () => {
    await context.secrets.delete(DEVPULSE_API_KEY_SECRET);

    void vscode.window.showInformationMessage('DevPulse API key cleared');
  });
}

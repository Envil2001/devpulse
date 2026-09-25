import * as vscode from 'vscode';

import { DEVPULSE_API_KEY_SECRET } from '../secret-keys.js';

const COMMAND_ID = 'devpulse.setApiKey';
const API_KEY_PATTERN = /^dp_live_[a-f0-9]{64}$/;

export function registerSetApiKeyCommand(context: vscode.ExtensionContext): vscode.Disposable {
  return vscode.commands.registerCommand(COMMAND_ID, async () => {
    const apiKey = await vscode.window.showInputBox({
      title: 'DevPulse API Key',
      prompt: 'Paste your API key.',
      password: true,
      ignoreFocusOut: true,
      validateInput: (value) => {
        const trimmedValue = value.trim();

        if (!trimmedValue) {
          return 'API key cannot be empty';
        }

        if (!API_KEY_PATTERN.test(trimmedValue)) {
          return 'Invalid API key format';
        }

        return null;
      },
    });

    if (apiKey === undefined) {
      return;
    }

    await context.secrets.store(DEVPULSE_API_KEY_SECRET, apiKey.trim());

    void vscode.window.showInformationMessage('DevPulse API key saved securely.');
  });
}

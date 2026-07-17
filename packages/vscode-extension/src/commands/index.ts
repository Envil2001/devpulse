import * as vscode from 'vscode';

import { registerHelloWorldCommand } from './hello-world.command.js';
import { registerSetApiKeyCommand } from './set-api-key.command.js';

export function registerCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
  return [registerHelloWorldCommand(), registerSetApiKeyCommand(context)];
}

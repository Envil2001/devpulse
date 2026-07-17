import type * as vscode from 'vscode';

import { registerHelloWorldCommand } from './hello-world.command.js';
import { registerSetApiKeyCommand } from './set-api-key.command.js';

export function registerCommands(context: vscode.ExtensionContext): Array<vscode.Disposable> {
  return [registerHelloWorldCommand(), registerSetApiKeyCommand(context)];
}

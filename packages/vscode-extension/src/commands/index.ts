import type * as vscode from 'vscode';

import { registerClearApiKeyCommand } from './clear-api-key.command.js';
import { registerHelloWorldCommand } from './hello-world.command.js';
import { registerSetApiKeyCommand } from './set-api-key.command.js';

export function registerCommands(context: vscode.ExtensionContext): Array<vscode.Disposable> {
  return [
    registerHelloWorldCommand(),
    registerSetApiKeyCommand(context),
    registerClearApiKeyCommand(context),
  ];
}

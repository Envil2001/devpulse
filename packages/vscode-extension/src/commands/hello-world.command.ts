import * as vscode from 'vscode';

const COMMAND_ID = 'devpulse.devpulse.helloWorld';

export function registerHelloWorldCommand(): vscode.Disposable {
  return vscode.commands.registerCommand(COMMAND_ID, () => {
    void vscode.window.showInformationMessage('Hello from DevPulse!');
  });
}

import type * as vscode from 'vscode';

/**
 * Documents we consider "user-editable workspace content".
 * Excludes output channels, terminals, settings, extension logs, etc.
 */
export function isTrackedTextDocument(document: vscode.TextDocument): boolean {
  if (document.isClosed) return false;
  const { scheme } = document.uri;
  return scheme === 'file' || scheme === 'untitled' || scheme === 'vscode-notebook-cell';
}

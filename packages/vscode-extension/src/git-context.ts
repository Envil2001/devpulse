import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import * as vscode from 'vscode';

const execFileAsync = promisify(execFile);

export interface GitContext {
  workspaceName: string | null;
  gitBranch: string | null;
  workspaceFolderPath: string | null;
}

interface WorkspaceFolderLike {
  name: string;
  uri: {
    fsPath: string;
  };
}

function isSameContext(a: GitContext, b: GitContext): boolean {
  return (
    a.workspaceName === b.workspaceName &&
    a.gitBranch === b.gitBranch &&
    a.workspaceFolderPath === b.workspaceFolderPath
  );
}

function isWorkspaceFolderLike(value: unknown): value is WorkspaceFolderLike {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as {
    name?: unknown;
    uri?: { fsPath?: unknown };
  };

  return typeof candidate.name === 'string' && typeof candidate.uri?.fsPath === 'string';
}

function resolveWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
  const activeEditor = vscode.window.activeTextEditor;
  if (activeEditor !== undefined) {
    const folder = vscode.workspace.getWorkspaceFolder(activeEditor.document.uri);
    if (folder !== undefined) {
      return folder;
    }
  }

  const [firstWorkspace] = vscode.workspace.workspaceFolders ?? [];
  return firstWorkspace;
}

function resolveWorkspaceName(folder: WorkspaceFolderLike | null): string | null {
  if (vscode.workspace.name !== undefined && vscode.workspace.name.trim().length > 0) {
    return vscode.workspace.name.trim();
  }

  if (folder !== null && folder.name.trim().length > 0) {
    return folder.name.trim();
  }

  return null;
}

async function resolveGitBranch(folderPath: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: folderPath,
    });
    const branch = stdout.trim();
    if (branch.length === 0 || branch === 'HEAD') {
      return null;
    }
    return branch;
  } catch {
    return null;
  }
}

export class GitContextProvider implements vscode.Disposable {
  private readonly disposables: Array<vscode.Disposable> = [];
  private readonly emitter = new vscode.EventEmitter<GitContext>();
  private refreshChain: Promise<void> = Promise.resolve();
  private gitWatchers: Array<vscode.Disposable> = [];
  private watchedWorkspaceFolderPath: string | null = null;
  private readonly handleGitMetadataChange = (): void => {
    this.scheduleRefresh();
  };
  private context: GitContext = {
    workspaceName: null,
    gitBranch: null,
    workspaceFolderPath: null,
  };

  readonly onDidChangeContext = this.emitter.event;

  constructor(private readonly log?: vscode.OutputChannel) {
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(() => {
        this.scheduleRefresh();
      }),
      vscode.workspace.onDidChangeWorkspaceFolders(() => {
        this.scheduleRefresh();
      }),
    );
    this.scheduleRefresh();
  }

  get currentContext(): GitContext {
    return this.context;
  }

  private scheduleRefresh(): void {
    this.refreshChain = this.refreshChain.then(async () => {
      const nextContext = await this.detectContext();
      if (isSameContext(this.context, nextContext)) {
        return;
      }

      if (this.watchedWorkspaceFolderPath !== nextContext.workspaceFolderPath) {
        this.resetGitWatchers(nextContext.workspaceFolderPath);
      }
      this.context = nextContext;
      this.log?.appendLine(
        `[git-context] workspace="${nextContext.workspaceName ?? 'n/a'}" branch="${nextContext.gitBranch ?? 'n/a'}"`,
      );
      this.emitter.fire(nextContext);
    });
  }

  private resetGitWatchers(workspaceFolderPath: string | null): void {
    for (const w of this.gitWatchers) {
      w.dispose();
    }
    this.gitWatchers = [];
    this.watchedWorkspaceFolderPath = workspaceFolderPath;

    if (workspaceFolderPath === null) {
      return;
    }

    // `git checkout` typically updates `.git/HEAD`. Watching it gives near-real-time branch changes
    // without depending on the built-in Git extension API.
    const headWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceFolderPath, '.git/HEAD'),
    );
    const packedRefsWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspaceFolderPath, '.git/packed-refs'),
    );

    this.gitWatchers.push(
      headWatcher,
      packedRefsWatcher,
      headWatcher.onDidChange(this.handleGitMetadataChange),
      headWatcher.onDidCreate(this.handleGitMetadataChange),
      headWatcher.onDidDelete(this.handleGitMetadataChange),
      packedRefsWatcher.onDidChange(this.handleGitMetadataChange),
      packedRefsWatcher.onDidCreate(this.handleGitMetadataChange),
      packedRefsWatcher.onDidDelete(this.handleGitMetadataChange),
    );
  }

  private async detectContext(): Promise<GitContext> {
    const detectedFolder = resolveWorkspaceFolder();
    const folder = isWorkspaceFolderLike(detectedFolder) ? detectedFolder : null;
    const workspaceFolderPath = folder?.uri.fsPath ?? null;
    const workspaceName = resolveWorkspaceName(folder);
    const gitBranch = workspaceFolderPath ? await resolveGitBranch(workspaceFolderPath) : null;

    return {
      workspaceName,
      gitBranch,
      workspaceFolderPath,
    };
  }

  dispose(): void {
    this.resetGitWatchers(null);
    for (const d of this.disposables) {
      d.dispose();
    }
    this.emitter.dispose();
  }
}

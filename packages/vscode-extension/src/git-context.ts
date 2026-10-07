import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import * as vscode from 'vscode';

const execFileAsync = promisify(execFile);

const GIT_COMMAND_TIMEOUT_MS = 3000;
const GIT_METADATA_DEBOUNCE_MS = 150;
const ACTIVE_EDITOR_DEBOUNCE_MS = 250;

export interface GitContext {
  workspaceName: string | null;
  gitBranch: string | null;
  gitRemoteUrl: string | null;
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
    a.gitRemoteUrl === b.gitRemoteUrl &&
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

let lastActiveFolder: vscode.WorkspaceFolder | undefined;

function resolveWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
  const activeEditor = vscode.window.activeTextEditor;
  const fallback = lastActiveFolder ?? vscode.workspace.workspaceFolders?.[0];

  if (!activeEditor) {
    return fallback;
  }

  const scheme = activeEditor.document.uri.scheme;

  if (scheme !== 'file') {
    return fallback;
  }

  const folder = vscode.workspace.getWorkspaceFolder(activeEditor.document.uri);

  if (folder) {
    lastActiveFolder = folder;
    return folder;
  }

  return undefined;
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

async function runGit(folderPath: string, args: Array<string>): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd: folderPath,
      timeout: GIT_COMMAND_TIMEOUT_MS,
    });

    const value = stdout.trim();
    return value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

async function resolveGitBranch(folderPath: string): Promise<string | null> {
  const branch = await runGit(folderPath, ['rev-parse', '--abbrev-ref', 'HEAD']);

  if (branch === null || branch === 'HEAD') {
    return null;
  }

  return branch;
}

async function resolveGitRemoteUrl(folderPath: string): Promise<string | null> {
  return runGit(folderPath, ['config', '--get', 'remote.origin.url']);
}

async function resolveGitDir(folderPath: string): Promise<string | null> {
  return runGit(folderPath, ['rev-parse', '--absolute-git-dir']);
}

interface DetectedGitState {
  context: GitContext;
  gitDir: string | null;
}

export class GitContextProvider implements vscode.Disposable {
  private readonly disposables: Array<vscode.Disposable> = [];
  private readonly emitter = new vscode.EventEmitter<GitContext>();

  private refreshChain: Promise<void> = Promise.resolve();

  private gitWatchers: Array<vscode.Disposable> = [];
  private watchedGitDir: string | null = null;

  private gitDebounceTimer: ReturnType<typeof setTimeout> | undefined;
  private activeEditorDebounce: ReturnType<typeof setTimeout> | undefined;

  private context: GitContext = {
    workspaceName: null,
    gitBranch: null,
    gitRemoteUrl: null,
    workspaceFolderPath: null,
  };

  readonly onDidChangeContext = this.emitter.event;

  constructor(private readonly log?: vscode.OutputChannel) {
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(() => {
        this.handleActiveEditorChange();
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

  private readonly handleGitMetadataChange = (): void => {
    clearTimeout(this.gitDebounceTimer);
    this.gitDebounceTimer = setTimeout(() => {
      this.gitDebounceTimer = undefined;
      this.scheduleRefresh();
    }, GIT_METADATA_DEBOUNCE_MS);
  };

  private handleActiveEditorChange(): void {
    clearTimeout(this.activeEditorDebounce);
    this.activeEditorDebounce = setTimeout(() => {
      this.activeEditorDebounce = undefined;
      this.scheduleRefresh();
    }, ACTIVE_EDITOR_DEBOUNCE_MS);
  }

  private scheduleRefresh(): void {
    this.refreshChain = this.refreshChain.then(
      () => this.runRefresh(),
      () => this.runRefresh(),
    );
  }

  private async runRefresh(): Promise<void> {
    try {
      const { context: nextContext, gitDir } = await this.detectContext();

      if (this.watchedGitDir !== gitDir) {
        this.resetGitWatchers(gitDir);
      }

      if (isSameContext(this.context, nextContext)) {
        return;
      }

      this.context = nextContext;
      this.log?.appendLine(
        `[info] workspace="${nextContext.workspaceName ?? 'n/a'}" branch="${nextContext.gitBranch ?? 'n/a'}" remote="${nextContext.gitRemoteUrl ?? 'n/a'}"`,
      );
      this.emitter.fire(nextContext);
    } catch (error) {
      this.log?.appendLine(`[error] refresh failed: ${String(error)}`);
    }
  }

  private resetGitWatchers(gitDir: string | null): void {
    for (const watcher of this.gitWatchers) {
      watcher.dispose();
    }
    this.gitWatchers = [];
    this.watchedGitDir = gitDir;

    this.log?.appendLine(`[debug] resetGitWatchers: gitDir="${gitDir ?? 'n/a'}"`);

    if (gitDir === null) {
      return;
    }

    const base = vscode.Uri.file(gitDir);

    const headWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(base, 'HEAD'),
    );
    const packedRefsWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(base, 'packed-refs'),
    );
    const configWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(base, 'config'),
    );

    this.gitWatchers.push(
      headWatcher,
      packedRefsWatcher,
      configWatcher,
      headWatcher.onDidChange(this.handleGitMetadataChange),
      headWatcher.onDidCreate(this.handleGitMetadataChange),
      headWatcher.onDidDelete(this.handleGitMetadataChange),
      packedRefsWatcher.onDidChange(this.handleGitMetadataChange),
      packedRefsWatcher.onDidCreate(this.handleGitMetadataChange),
      packedRefsWatcher.onDidDelete(this.handleGitMetadataChange),
      configWatcher.onDidChange(this.handleGitMetadataChange),
      configWatcher.onDidCreate(this.handleGitMetadataChange),
      configWatcher.onDidDelete(this.handleGitMetadataChange),
    );
  }

  private async detectContext(): Promise<DetectedGitState> {
    const detectedFolder = resolveWorkspaceFolder();
    const folder = isWorkspaceFolderLike(detectedFolder) ? detectedFolder : null;
    const workspaceFolderPath = folder?.uri.fsPath ?? null;
    const workspaceName = resolveWorkspaceName(folder);

    this.log?.appendLine(
      `[debug] detectContext: folder="${folder?.name ?? 'n/a'}" path="${workspaceFolderPath ?? 'n/a'}"`,
    );

    if (workspaceFolderPath === null) {
      return {
        context: {
          workspaceName,
          gitBranch: null,
          gitRemoteUrl: null,
          workspaceFolderPath: null,
        },
        gitDir: null,
      };
    }

    const [gitBranch, gitRemoteUrl, gitDir] = await Promise.all([
      resolveGitBranch(workspaceFolderPath),
      resolveGitRemoteUrl(workspaceFolderPath),
      resolveGitDir(workspaceFolderPath),
    ]);

    return {
      context: {
        workspaceName,
        gitBranch,
        gitRemoteUrl,
        workspaceFolderPath,
      },
      gitDir,
    };
  }

  dispose(): void {
    if (this.activeEditorDebounce !== undefined) {
      clearTimeout(this.activeEditorDebounce);
      this.activeEditorDebounce = undefined;
    }

    if (this.gitDebounceTimer !== undefined) {
      clearTimeout(this.gitDebounceTimer);
      this.gitDebounceTimer = undefined;
    }

    this.resetGitWatchers(null);

    for (const disposable of this.disposables) {
      disposable.dispose();
    }

    this.emitter.dispose();
  }
}

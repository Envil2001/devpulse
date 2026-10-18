import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';

import * as vscode from 'vscode';

const execFileAsync = promisify(execFile);

const GIT_TIMEOUT_MS = 3000;
const DEBOUNCE_MS = 500;
const RECENT_COMMIT_WINDOW_MS = 5 * 60 * 1000;

export interface GitCommitEvent {
  hash: string;
  message: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
  filesList: Array<string>;
}

export class GitCommitWatcher implements vscode.Disposable {
  private readonly emitter = new vscode.EventEmitter<GitCommitEvent>();
  readonly onDidCommit = this.emitter.event;

  private currentWorkspacePath: string | null = null;
  private currentGitDir: string | null = null;
  private watcher: vscode.FileSystemWatcher | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private lastHash: string | null = null;

  constructor(private readonly log?: vscode.LogOutputChannel) {}

  public async setWorkspaceFolder(folderPath: string | null): Promise<void> {
    if (folderPath === this.currentWorkspacePath) return;

    this.teardown();
    this.currentWorkspacePath = folderPath;

    if (folderPath === null) return;

    const gitDir = await this.resolveGitDir(folderPath);
    if (gitDir === null) {
      this.log?.info(`no git dir at ${folderPath}`);
      return;
    }

    this.currentGitDir = gitDir;
    this.attach(gitDir);
    await this.seedHash(gitDir);
  }

  private teardown(): void {
    if (this.debounceTimer !== undefined) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
    this.watcher?.dispose();
    this.watcher = null;
    this.currentGitDir = null;
    this.lastHash = null;
  }

  private attach(gitDir: string): void {
    const logsHead = vscode.Uri.file(path.join(gitDir, 'logs', 'HEAD'));
    const pattern = new vscode.RelativePattern(vscode.Uri.file(gitDir), path.join('logs', 'HEAD'));

    this.watcher = vscode.workspace.createFileSystemWatcher(pattern);

    this.watcher.onDidChange(this.handleHeadChange);
    this.watcher.onDidCreate(this.handleHeadChange);

    this.log?.info(`watching ${logsHead.fsPath}`);
  }

  private readonly handleHeadChange = (): void => {
    if (this.debounceTimer !== undefined) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = undefined;
      void this.process();
    }, DEBOUNCE_MS);
  };

  private async seedHash(gitDir: string): Promise<void> {
    const result = await this.readLastCommit(gitDir);
    if (result) {
      this.lastHash = result.hash;
      this.log?.info(`seeded hash ${result.hash.slice(0, 7)} (no event)`);
    }
  }

  private async process(): Promise<void> {
    if (this.currentGitDir === null) return;

    const result = await this.readLastCommit(this.currentGitDir);
    if (!result) return;

    if (result.hash === this.lastHash) return;

    const ageMs = Date.now() - result.commitTimestamp;
    if (ageMs > RECENT_COMMIT_WINDOW_MS) {
      this.lastHash = result.hash;
      this.log?.info(`skipped ${result.hash.slice(0, 7)} (old timestamp)`);
      return;
    }

    this.lastHash = result.hash;
    this.log?.info(`new commit ${result.hash.slice(0, 7)}: ${result.message.slice(0, 60)}`);
    this.emitter.fire(result);
  }

  private async readLastCommit(
    gitDir: string,
  ): Promise<(GitCommitEvent & { commitTimestamp: number }) | null> {
    try {
      const { stdout: logOut } = await execFileAsync(
        'git',
        ['--git-dir', gitDir, 'log', '-1', '--format=%H%n%ct%n%s', '--no-color'],
        { timeout: GIT_TIMEOUT_MS },
      );

      const lines = logOut.trimEnd().split('\n');
      if (lines.length < 3) return null;

      const hash = lines[0].trim();
      const commitTimestamp = Number.parseInt(lines[1].trim(), 10) * 1000;
      const message = lines.slice(2).join('\n').trim();

      const { stdout: numstatOut } = await execFileAsync(
        'git',
        ['--git-dir', gitDir, 'show', '--numstat', '--format=', '--no-color', hash],
        { timeout: GIT_TIMEOUT_MS },
      );

      let insertions = 0;
      let deletions = 0;
      const filesList: Array<string> = [];

      for (const line of numstatOut.split('\n')) {
        const match = /^(\d+)\t(\d+)\t(.+)$/.exec(line);
        if (!match) continue;

        insertions += Number.parseInt(match[1], 10);
        deletions += Number.parseInt(match[2], 10);
        filesList.push(match[3].trim());
      }

      return {
        hash,
        message: message.slice(0, 500),
        filesChanged: filesList.length,
        insertions,
        deletions,
        filesList: filesList.slice(0, 10),
        commitTimestamp,
      };
    } catch (error) {
      this.log?.info(`read failed: ${String(error)}`);
      return null;
    }
  }

  private async resolveGitDir(folderPath: string): Promise<string | null> {
    try {
      const { stdout } = await execFileAsync('git', ['rev-parse', '--absolute-git-dir'], {
        cwd: folderPath,
        timeout: GIT_TIMEOUT_MS,
      });
      const dir = stdout.trim();
      return dir.length > 0 ? dir : null;
    } catch {
      return null;
    }
  }

  public dispose(): void {
    this.teardown();
    this.emitter.dispose();
  }
}

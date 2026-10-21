import * as vscode from 'vscode';

export interface AiInteractionEvent {
  tool: string;
  linesCount: number;
}

const KNOWN_AI_EXTENSIONS = [
  { id: 'github.copilot', name: 'copilot' },
  { id: 'github.copilot-chat', name: 'copilot-chat' },
  { id: 'saoudrizwan.claude-dev', name: 'claude-dev' },
  { id: 'cline.cline', name: 'cline' },
  { id: 'continue.continue', name: 'continue' },
  { id: 'sourcegraph.cody-ai', name: 'cody' },
  { id: 'codeium.codeium', name: 'codeium' },
];

export class AiMonitor implements vscode.Disposable {
  private readonly disposables: Array<vscode.Disposable> = [];
  private readonly emitter = new vscode.EventEmitter<AiInteractionEvent>();
  readonly onDidDetectAi = this.emitter.event;

  private activeAiTool: string | null = null;
  private lastRecordedAt = 0;
  private readonly THROTTLE_MS = 10_000;

  constructor(private readonly log?: vscode.LogOutputChannel) {
    this.detectInstalledAiTools();

    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        this.inspectTextChange(event);
      }),
    );
  }

  private detectInstalledAiTools(): void {
    for (const ext of KNOWN_AI_EXTENSIONS) {
      if (vscode.extensions.getExtension(ext.id)) {
        this.activeAiTool = ext.name;
        this.log?.info(`AI Monitor: detected active assistant [${ext.name}]`);
        break;
      }
    }
  }

  private inspectTextChange(event: vscode.TextDocumentChangeEvent): void {
    if (!this.activeAiTool) return;
    if (event.contentChanges.length === 0) return;

    const now = Date.now();
    if (now - this.lastRecordedAt < this.THROTTLE_MS) {
      return;
    }

    for (const change of event.contentChanges) {
      const isMultiLine = change.text.includes('\n');
      const isLargeChunk = change.text.length > 40;
      const isPureInsertion = change.rangeLength === 0;
      const isOnlyWhitespace = change.text.trim().length === 0;

      if (isMultiLine && isLargeChunk && isPureInsertion && !isOnlyWhitespace) {
        this.lastRecordedAt = now;
        const lines = change.text.split('\n').length;

        this.log?.info(`AI Monitor: throttled AI insertion accepted (~${String(lines)} lines)`);

        this.emitter.fire({
          tool: this.activeAiTool,
          linesCount: lines,
        });
        break;
      }
    }
  }

  public dispose(): void {
    this.emitter.dispose();
    for (const d of this.disposables) d.dispose();
  }
}

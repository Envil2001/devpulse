import type * as vscode from 'vscode';

import type { TelemetryEventPayload } from './types.js';

const BUFFER_KEY = 'devpulse.telemetryBuffer.v1';
const MAX_BUFFER_SIZE = 500;

export class TelemetryBufferStore {
  public load(context: vscode.ExtensionContext): Array<TelemetryEventPayload> {
    const value = context.globalState.get<Array<TelemetryEventPayload>>(BUFFER_KEY);
    return Array.isArray(value) ? value : [];
  }

  public async save(
    context: vscode.ExtensionContext,
    events: Array<TelemetryEventPayload>,
  ): Promise<void> {
    const trimmed =
      events.length > MAX_BUFFER_SIZE ? events.slice(events.length - MAX_BUFFER_SIZE) : events;
    await context.globalState.update(BUFFER_KEY, trimmed);
  }
}

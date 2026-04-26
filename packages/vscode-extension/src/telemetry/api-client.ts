import * as vscode from 'vscode';

import { DEVPULSE_API_KEY_SECRET } from '../secret-keys.js';

import { type TelemetryBatchRequest } from './types.js';

const DEFAULT_API_BASE_URL = 'http://localhost:3000/api/v1';

function trimTrailingSlashes(value: string): string {
  let result = value.trim();
  while (result.endsWith('/')) {
    result = result.slice(0, -1);
  }
  return result;
}

function resolveApiBaseUrl(): string {
  const configured = vscode.workspace.getConfiguration('devpulse').get<string>('apiUrl');
  if (configured !== undefined && configured.trim().length > 0) {
    return trimTrailingSlashes(configured);
  }

  const envValue = process.env.DEVPULSE_API_URL;
  if (envValue !== undefined && envValue.trim().length > 0) {
    return trimTrailingSlashes(envValue);
  }

  return DEFAULT_API_BASE_URL;
}

export class TelemetryApiClient {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly log?: vscode.OutputChannel,
  ) {}

  public async postEventsBatch(payload: TelemetryBatchRequest): Promise<void> {
    const apiKey = await this.context.secrets.get(DEVPULSE_API_KEY_SECRET);
    if (apiKey === undefined || apiKey.trim().length === 0) {
      throw new Error('MissingApiKey');
    }

    const url = `${resolveApiBaseUrl()}/telemetry/events/batch`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      this.log?.appendLine(
        `[telemetry] request failed status=${String(response.status)} body=${text.slice(0, 500)}`,
      );
      throw new Error(`TelemetryRequestFailed:${String(response.status)}`);
    }
  }
}

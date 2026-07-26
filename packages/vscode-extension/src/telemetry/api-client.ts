import * as vscode from 'vscode';

import { env } from '@devpulse/env/extension';
import {
  type ApiErrorResponse,
  type ApiResponse,
  type ApiSuccessResponse,
  type TelemetryEventDto,
} from '@devpulse/lib';

import { DEVPULSE_API_KEY_SECRET } from '../secret-keys.js';

export class TelemetryApiClientError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'TelemetryApiClientError';
    this.status = status;
    this.details = details;
  }
}

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

  return env.DEVPULSE_API_URL;
}

async function readJson<TResponse>(response: Response): Promise<TResponse> {
  const body = (await response.json()) as ApiResponse<TResponse>;

  if (!response.ok) {
    const errorBody = body as ApiErrorResponse;
    throw new TelemetryApiClientError(
      errorBody.error.message,
      response.status,
      errorBody.error.details,
    );
  }

  const successBody = body as ApiSuccessResponse<TResponse>;
  return successBody.data;
}

export class TelemetryApiClient {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly log?: vscode.OutputChannel,
  ) {}

  public async postEventsBatch(payload: { events: Array<TelemetryEventDto> }): Promise<void> {
    const apiKey = await this.context.secrets.get(DEVPULSE_API_KEY_SECRET);
    if (apiKey === undefined || apiKey.trim().length === 0) {
      throw new Error('MissingApiKey');
    }

    const url = `${resolveApiBaseUrl()}/telemetry/events/batch`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey.trim(),
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      this.log?.appendLine(`[telemetry] network error: ${String(error)}`);
      throw new Error('TelemetryRequestNetworkError');
    }

    try {
      await readJson<null>(response);
    } catch (error) {
      if (error instanceof TelemetryApiClientError) {
        this.log?.appendLine(
          `[telemetry] request failed status=${String(error.status)} message=${error.message}`,
        );
        throw new Error(`TelemetryRequestFailed:${String(error.status)}`);
      }
      throw error;
    }
  }
}

import { promisify } from 'node:util';
import { gzip } from 'node:zlib';

import * as vscode from 'vscode';

import { env } from '@devpulse/env/extension';
import {
  type ApiErrorResponse,
  type ApiResponse,
  type ApiSuccessResponse,
  type TelemetryEventDto,
} from '@devpulse/lib';

const gzipAsync = promisify(gzip);
const COMPRESSION_THRESHOLD_BYTES = 10_240; // 10 KB

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
  if (configured?.trim()) {
    return trimTrailingSlashes(configured);
  }
  const fromEnv = env.DEVPULSE_API_URL;
  if (!fromEnv.trim()) {
    throw new Error(
      'DevPulse API URL is not configured. Set devpulse.apiUrl or DEVPULSE_API_URL env.',
    );
  }
  return trimTrailingSlashes(fromEnv);
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

    const bodyRaw = JSON.stringify(payload);
    let body: string | ArrayBuffer = bodyRaw;

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-api-key': apiKey.trim(),
    };

    const rawSize = Buffer.byteLength(bodyRaw, 'utf8');

    if (rawSize > COMPRESSION_THRESHOLD_BYTES) {
      const before = performance.now();

      const compressed = await gzipAsync(bodyRaw);

      const after = performance.now();

      body = compressed.buffer.slice(
        compressed.byteOffset,
        compressed.byteOffset + compressed.byteLength,
      );

      headers['content-encoding'] = 'gzip';

      const compressedSize = compressed.byteLength;
      const ratio = ((1 - compressedSize / rawSize) * 100).toFixed(1);

      this.log?.appendLine(
        `[telemetry] compressed ${String(rawSize)}B → ${String(compressedSize)}B ` +
          `(${ratio}% reduction, ${(after - before).toFixed(2)}ms)`,
      );
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(30_000), // 30 seconds
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

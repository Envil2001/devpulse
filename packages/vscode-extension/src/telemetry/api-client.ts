import { promisify } from 'node:util';
import { gzip } from 'node:zlib';

import * as vscode from 'vscode';

import {
  type ApiErrorResponse,
  type ApiResponse,
  type ApiSuccessResponse,
  type TelemetryEventDto,
} from '@devpulse/lib';

import { DEVPULSE_API_KEY_SECRET } from '../secret-keys.js';

const gzipAsync = promisify(gzip);
const COMPRESSION_THRESHOLD_BYTES = 10_240; // 10 KB
const EXTENSION_ID = 'devpulse.devpulse';
const CONFIG_NAMESPACE = 'devpulse';
const CONFIG_KEY = 'apiUrl';

interface TodayStatsResponse {
  totalActiveSeconds: number;
  averageFocusScore: number;
  sessionsCount: number;
}

interface PackageJsonManifest {
  contributes?: {
    configuration?: {
      properties?: Record<string, { default?: unknown }>;
    };
  };
}

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

function readManifestDefaultApiUrl(): string | null {
  const extension = vscode.extensions.getExtension(EXTENSION_ID);
  const manifest = extension?.packageJSON as PackageJsonManifest | undefined;

  const raw =
    manifest?.contributes?.configuration?.properties?.[`${CONFIG_NAMESPACE}.${CONFIG_KEY}`]
      ?.default;

  return typeof raw === 'string' && raw.trim().length > 0 ? raw : null;
}

function resolveApiBaseUrl(): string {
  const configured = vscode.workspace.getConfiguration(CONFIG_NAMESPACE).get<string>(CONFIG_KEY);

  const url = configured?.trim() ? configured : readManifestDefaultApiUrl();

  if (url === null) {
    throw new Error(
      `DevPulse: "${CONFIG_NAMESPACE}.${CONFIG_KEY}" is not configured and no default is present in package.json.`,
    );
  }

  return trimTrailingSlashes(url);
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
    private readonly log?: vscode.LogOutputChannel,
  ) {}

  public async postEventsBatch(
    payload: { events: Array<TelemetryEventDto> },
    signal?: AbortSignal,
  ): Promise<void> {
    const apiKey = await this.requireApiKey();
    const url = `${resolveApiBaseUrl()}/telemetry/events/batch`;

    const bodyRaw = JSON.stringify(payload);
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'x-api-key': apiKey,
    };

    let body: string | ArrayBuffer = bodyRaw;
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

      const ratio = ((1 - compressed.byteLength / rawSize) * 100).toFixed(1);
      this.log?.info(
        `compressed ${String(rawSize)}B → ${String(compressed.byteLength)}B ` +
          `(${ratio}% reduction, ${(after - before).toFixed(2)}ms)`,
      );
    }

    let response: Response;
    try {
      this.log?.info(`POST ${url} size=${String(rawSize)}B`);
      response = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: signal ?? AbortSignal.timeout(30_000),
      });
    } catch (error) {
      this.log?.error(`network error: ${String(error)}`);
      throw new Error('TelemetryRequestNetworkError');
    }

    try {
      await readJson<null>(response);
    } catch (error) {
      if (error instanceof TelemetryApiClientError) {
        this.log?.error(`request failed status=${String(error.status)} message=${error.message}`);
        throw new Error(`TelemetryRequestFailed:${String(error.status)}`);
      }
      throw error;
    }
  }

  public async getTodayStats(): Promise<{
    activeSeconds: number;
    focusScore: number;
    sessionsCount: number;
  }> {
    const apiKey = await this.requireApiKey();
    const url = `${resolveApiBaseUrl()}/telemetry/today`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: { 'x-api-key': apiKey },
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      this.log?.error(`stats network error: ${String(error)}`);
      throw new Error('TelemetryRequestNetworkError');
    }

    try {
      const data = await readJson<TodayStatsResponse>(response);
      return {
        activeSeconds: data.totalActiveSeconds,
        focusScore: data.averageFocusScore,
        sessionsCount: data.sessionsCount,
      };
    } catch (error) {
      if (error instanceof TelemetryApiClientError) {
        this.log?.error(
          `stats request failed status=${String(error.status)} message=${error.message}`,
        );
        throw new Error(`TelemetryRequestFailed:${String(error.status)}`);
      }
      throw error;
    }
  }

  private async requireApiKey(): Promise<string> {
    const apiKey = await this.context.secrets.get(DEVPULSE_API_KEY_SECRET);
    if (apiKey === undefined || apiKey.trim().length === 0) {
      throw new Error('MissingApiKey');
    }
    return apiKey.trim();
  }
}

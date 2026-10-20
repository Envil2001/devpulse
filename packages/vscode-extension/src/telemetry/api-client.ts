import { promisify } from 'node:util';
import { gzip } from 'node:zlib';

import * as vscode from 'vscode';

import type { TelemetryEventDto } from '@devpulse/lib';

import { DEVPULSE_API_KEY_SECRET } from '../secret-keys.js';

import { TelemetryRequestError } from './telemetry-request-error.js';

const gzipAsync = promisify(gzip);

const COMPRESSION_THRESHOLD_BYTES = 10_240;
const BATCH_TIMEOUT_MS = 30_000;
const STATS_TIMEOUT_MS = 10_000;
const CONFIG_NAMESPACE = 'devpulse';
const CONFIG_KEY = 'apiUrl';

export interface TodayStats {
  activeSeconds: number;
  focusScore: number;
  sessionsCount: number;
}

interface TodayStatsResponse {
  totalActiveSeconds: number;
  averageFocusScore: number | null;
  sessionsCount: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTodayStatsResponse(value: unknown): value is TodayStatsResponse {
  return (
    isRecord(value) &&
    typeof value.totalActiveSeconds === 'number' &&
    (typeof value.averageFocusScore === 'number' || value.averageFocusScore === null) &&
    typeof value.sessionsCount === 'number'
  );
}

function trimTrailingSlashes(value: string): string {
  let result = value.trim();
  while (result.endsWith('/')) {
    result = result.slice(0, -1);
  }
  return result;
}

function resolveApiBaseUrl(): string {
  const config = vscode.workspace.getConfiguration(CONFIG_NAMESPACE);
  const configured = config.get<string>(CONFIG_KEY)?.trim();
  const url = configured ?? config.inspect<string>(CONFIG_KEY)?.defaultValue?.trim();

  if (!url) {
    throw new Error(`DevPulse: "${CONFIG_NAMESPACE}.${CONFIG_KEY}" is not configured.`);
  }

  return trimTrailingSlashes(url);
}

async function readData(response: Response): Promise<unknown> {
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = isRecord(body) ? body.error : undefined;
    const message =
      isRecord(error) && typeof error.message === 'string'
        ? error.message
        : `HTTP ${String(response.status)}`;

    throw new TelemetryRequestError(
      message,
      response.status,
      isRecord(error) ? error.details : undefined,
    );
  }

  return isRecord(body) ? body.data : undefined;
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

    this.log?.info(`POST ${url} size=${String(rawSize)}B`);

    const response = await this.request(url, {
      method: 'POST',
      headers,
      body,
      signal: signal ?? AbortSignal.timeout(BATCH_TIMEOUT_MS),
    });

    await readData(response);
  }

  public async getTodayStats(): Promise<TodayStats> {
    const apiKey = await this.requireApiKey();
    const url = `${resolveApiBaseUrl()}/telemetry/today`;

    const response = await this.request(url, {
      method: 'GET',
      headers: { 'x-api-key': apiKey },
      signal: AbortSignal.timeout(STATS_TIMEOUT_MS),
    });

    const data = await readData(response);

    if (!isTodayStatsResponse(data)) {
      throw new TelemetryRequestError('Unexpected response shape', null);
    }

    return {
      activeSeconds: data.totalActiveSeconds,
      focusScore: data.averageFocusScore ?? 0,
      sessionsCount: data.sessionsCount,
    };
  }

  private async request(url: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(url, init);
    } catch (error: unknown) {
      this.log?.error(`network error: ${String(error)}`);
      throw new TelemetryRequestError('Network error', null);
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

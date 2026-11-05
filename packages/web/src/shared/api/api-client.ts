import { env } from '@devpulse/env/client';
import { type ApiErrorResponse, type ApiSuccessResponse } from '@devpulse/lib';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export function buildApiUrl(path: string, params?: QueryParams): string {
  const baseUrl = env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${baseUrl}${normalizedPath}`);

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== null && value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  authToken?: string;
}

interface GetOptions extends RequestOptions {
  params?: QueryParams;
}

export async function readJson<TResponse>(response: Response): Promise<TResponse> {
  const body = (await response.json()) as ApiSuccessResponse<TResponse> | ApiErrorResponse;

  if (!response.ok || body.success !== true) {
    const message =
      body.success === false ? body.error.message : `Request failed (${response.status})`;
    const details = body.success === false ? body.error.details : undefined;
    throw new ApiClientError(message, response.status, details);
  }

  return body.data;
}

export async function postJson<TResponse, TRequest>(
  path: string,
  payload: TRequest,
  options: RequestOptions = {},
): Promise<TResponse> {
  const response = await fetch(buildApiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.authToken ? { Authorization: `Bearer ${options.authToken}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return readJson<TResponse>(response);
}

export async function getJson<TResponse>(
  path: string,
  options: GetOptions = {},
): Promise<TResponse> {
  const response = await fetch(buildApiUrl(path, options.params), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.authToken ? { Authorization: `Bearer ${options.authToken}` } : {}),
    },
    credentials: 'include',
  });

  return readJson<TResponse>(response);
}

export async function deleteJson<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const response = await fetch(buildApiUrl(path), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(options.authToken ? { Authorization: `Bearer ${options.authToken}` } : {}),
    },
    credentials: 'include',
  });

  return readJson<TResponse>(response);
}

export async function patchJson<TResponse, TRequest>(
  path: string,
  payload: TRequest,
  options: RequestOptions = {},
): Promise<TResponse> {
  const response = await fetch(buildApiUrl(path), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(options.authToken ? { Authorization: `Bearer ${options.authToken}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  return readJson<TResponse>(response);
}

export async function getBlob(path: string, options: GetOptions = {}): Promise<Blob> {
  const response = await fetch(buildApiUrl(path, options.params), {
    method: 'GET',
    headers: {
      ...(options.authToken ? { Authorization: `Bearer ${options.authToken}` } : {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const body = (await response.json()) as ApiErrorResponse;
    throw new ApiClientError(body.error.message, response.status, body.error.details);
  }

  return response.blob();
}

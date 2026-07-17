import { type ApiErrorResponse, type ApiSuccessResponse } from '@devpulse/lib';
import { env } from '@devpulse/env/client';
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

function buildHeaders(options: RequestOptions): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(options.authToken !== undefined ? { Authorization: `Bearer ${options.authToken}` } : {}),
  };
}

async function readJson<TResponse>(response: Response): Promise<TResponse> {
  const body = (await response.json()) as ApiSuccessResponse<TResponse> | ApiErrorResponse;

  if (!response.ok || body.success === false) {
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
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
    method: 'POST',
    headers: buildHeaders(options),
    body: JSON.stringify(payload),
  });

  return readJson<TResponse>(response);
}

export async function getJson<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
    method: 'GET',
    headers: buildHeaders(options),
  });

  return readJson<TResponse>(response);
}

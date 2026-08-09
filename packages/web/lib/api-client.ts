import { type ApiErrorResponse, type ApiSuccessResponse } from '@devpulse/lib';
import { env } from '@devpulse/env/client';

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

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
  let url = `${env.NEXT_PUBLIC_API_URL}${path}`;

  if (options.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, value]) => {
      if (value != null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const response = await fetch(url, {
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
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
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
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
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

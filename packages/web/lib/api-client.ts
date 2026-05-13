const DEFAULT_API_BASE_URL = 'http://localhost:3000/api/v1';

interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  path: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: number;
    message: string;
    details?: unknown;
  };
  timestamp: string;
  path: string;
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

function resolveApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
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
  const body = (await response.json()) as SuccessResponse<TResponse> | ErrorResponse;

  if (!response.ok || body.success === false) {
    const message = body.success === false ? body.error.message : `Request failed (${response.status})`;
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
  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
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
  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    method: 'GET',
    headers: buildHeaders(options),
  });

  return readJson<TResponse>(response);
}

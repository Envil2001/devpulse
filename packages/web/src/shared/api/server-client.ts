import { cookies } from 'next/headers';
import { env } from '@devpulse/env/client';
import { QueryParams } from './api-client';

interface ServerRequestOptions {
  params?: QueryParams;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export async function serverGet<T>(
  endpoint: string,
  options: ServerRequestOptions = {},
): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  const baseUrl = env.NEXT_PUBLIC_API_URL;
  const url = new URL(
    endpoint.startsWith('/') ? `${baseUrl}${endpoint}` : `${baseUrl}/${endpoint}`,
  );

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const res = await fetch(url.toString(), {
    headers: {
      ...(token && {
        Cookie: `access_token=${token}`,
        Authorization: `Bearer ${token}`,
      }),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`[Server API] GET ${endpoint} failed: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as ApiResponse<T>;
  return (json.data ?? json) as T;
}

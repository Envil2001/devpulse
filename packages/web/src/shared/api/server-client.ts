import { cookies } from 'next/headers';
import { buildApiUrl, readJson, type QueryParams } from './api-client';

interface ServerRequestOptions {
  params?: QueryParams;
  authToken?: string;
}

export async function getServerAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('access_token')?.value;
}

export async function serverGet<T>(
  endpoint: string,
  options: ServerRequestOptions = {},
): Promise<T> {
  const token = options.authToken ?? (await getServerAuthToken());

  const response = await fetch(buildApiUrl(endpoint, options.params), {
    headers: {
      ...(token && {
        Cookie: `access_token=${token}`,
        Authorization: `Bearer ${token}`,
      }),
    },
    cache: 'no-store',
  });

  return readJson<T>(response);
}

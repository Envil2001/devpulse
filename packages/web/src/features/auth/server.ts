import type { User } from '@/shared/types';

import { ApiClientError } from '@/shared/api/api-client';
import { getServerAuthToken, serverGet } from '@/shared/api/server-client';

export async function getServerUser(): Promise<User | null> {
  const token = await getServerAuthToken();

  if (!token) return null;

  try {
    return await serverGet<User>('/auth/me', { authToken: token });
  } catch (error) {
    if (error instanceof ApiClientError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    console.error('Failed to fetch user on server:', error);
    return null;
  }
}

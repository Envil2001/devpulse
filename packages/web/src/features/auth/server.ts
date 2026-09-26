import { cookies } from 'next/headers';
import type { User } from './api';

export async function getServerUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  if (!token) return null;

  try {
    const baseUrl = 'http://localhost:3000/api/v1';

    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: {
        Cookie: `access_token=${token}`,
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();

    return (json.data ?? json) as User;
  } catch (error) {
    console.error('Failed to fetch user on server:', error);
    return null;
  }
}

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getJson, patchJson, postJson } from '@/lib/api-client';

export interface User {
  id: string;
  email: string;
  displayName: string;
  timezone: string | null;
  hourlyRate: number;
  currency: string;
}

interface UpdateProfileDto {
  displayName?: string;
  timezone?: string;
  hourlyRate?: number;
  currency?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  updateProfile: (dto: UpdateProfileDto) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getJson<User>('/auth/me');
        setUser(userData);
      } catch {
        setUser(null);
        console.log('Not authenticated');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await postJson('/auth/logout', {});
    } catch (error) {
      console.error('Logout error (server-side):', error);
    } finally {
      setUser(null);
      router.replace('/login');
    }
  };

  const updateProfile = async (dto: UpdateProfileDto) => {
    const updated = await patchJson<User, UpdateProfileDto>('/users/me', dto);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthContextProvider');
  }
  return context;
}

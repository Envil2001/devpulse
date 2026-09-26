'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getJson, postJson, patchJson } from '@/shared/api/api-client';

export interface User {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
  hourlyRate: number;
  currency: string;
  hasOpenaiKey: boolean;
}

export interface UpdateProfileDto {
  displayName?: string;
  timezone?: string;
  hourlyRate?: number;
  currency?: string;
  openaiKey?: string | null;
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

export function AuthContextProvider({ children }: { children: ReactNode }) {
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
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = (userData: User) => setUser(userData);

  const logout = async () => {
    try {
      await postJson('/auth/logout', {});
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

interface AuthenticatedContextType {
  user: User;
  logout: () => Promise<void>;
  updateProfile: (dto: UpdateProfileDto) => Promise<void>;
}

const AuthenticatedContext = createContext<AuthenticatedContextType | undefined>(undefined);

export function AuthenticatedUserProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: User;
}) {
  const [user, setUser] = useState<User>(initialUser);
  const router = useRouter();

  const logout = async () => {
    try {
      await postJson('/auth/logout', {});
    } finally {
      router.replace('/login');
    }
  };

  const updateProfile = async (dto: UpdateProfileDto) => {
    const updated = await patchJson<User, UpdateProfileDto>('/users/me', dto);
    setUser(updated);
  };

  return (
    <AuthenticatedContext.Provider value={{ user, logout, updateProfile }}>
      <AuthContext.Provider
        value={{
          user,
          isAuthenticated: true,
          isLoading: false,
          login: () => {},
          logout,
          updateProfile,
        }}
      >
        {children}
      </AuthContext.Provider>
    </AuthenticatedContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthContextProvider');
  }
  return context;
}

export function useRequireAuth(): AuthenticatedContextType {
  const context = useContext(AuthenticatedContext);
  if (!context) {
    throw new Error('useRequireAuth must be used within AuthenticatedUserProvider');
  }
  return context;
}

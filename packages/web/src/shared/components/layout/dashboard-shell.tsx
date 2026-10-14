'use client';

import { useState, type ReactNode } from 'react';
import type { User } from '@/features/auth/api';
import { AuthenticatedUserProvider } from '@/features/auth/context';
import { Sidebar } from './sidebar';
import { Header } from './header';

interface DashboardShellProps {
  children: ReactNode;
  user: User;
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <AuthenticatedUserProvider initialUser={user}>
      <div className="relative min-h-dvh w-full bg-background text-foreground">
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

        <div className="relative flex min-h-dvh flex-1 flex-col lg:pl-64">
          <Header
            onMenuToggle={() => setIsMobileMenuOpen((p) => !p)}
            isMenuOpen={isMobileMenuOpen}
          />

          <main className="flex-1 overflow-y-auto pt-14">
            <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8">{children}</div>
          </main>
        </div>
      </div>
    </AuthenticatedUserProvider>
  );
}

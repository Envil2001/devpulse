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
      <div className="h-dvh w-full bg-neutral-950 text-neutral-100 transition-colors duration-200">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-175 rounded-full bg-linear-to-b from-white/4 to-transparent blur-3xl"
        />
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

        <div className="flex flex-1 flex-col min-w-0 lg:pl-64">
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

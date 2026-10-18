'use client';

import { useState, type ReactNode } from 'react';
import { AuthenticatedUserProvider } from '@/features/auth/context';
import { DashboardTour } from '@/shared/components/onboarding/dashboard-tour';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { User } from '@/shared/types';

interface DashboardShellProps {
  children: ReactNode;
  user: User;
}

export function DashboardShell({ children, user }: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <AuthenticatedUserProvider initialUser={user}>
      <div
        className="relative flex min-h-dvh w-full bg-background text-foreground"
        style={
          {
            '--sidebar-width': isSidebarCollapsed ? 'var(--sidebar-width-collapsed)' : '16rem',
          } as React.CSSProperties
        }
      >
        <Sidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          isCollapsed={isSidebarCollapsed}
        />

        <div className="relative flex min-h-dvh min-w-0 flex-1 flex-col lg:pl-(--sidebar-width) transition-[padding] duration-200 ease-out">
          <Header
            onMenuToggle={() => setIsMobileMenuOpen((p) => !p)}
            isMenuOpen={isMobileMenuOpen}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed((p) => !p)}
          />

          <main className="flex-1 overflow-y-auto pt-14">
            <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8">{children}</div>
          </main>
        </div>
      </div>

      <DashboardTour userId={user.id} />
    </AuthenticatedUserProvider>
  );
}

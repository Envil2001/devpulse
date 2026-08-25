'use client';

import { useState } from 'react';
import { Sidebar } from '@/shared/components/layout/sidebar';
import { Header } from '@/shared/components/layout/header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-dvh w-full bg-neutral-950 text-neutral-100 transition-colors duration-200">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      <div className="flex flex-1 flex-col min-w-0 lg:pl-64">
        <Header onMenuToggle={() => setIsMobileMenuOpen((p) => !p)} isMenuOpen={isMobileMenuOpen} />

        <main className="flex-1 overflow-y-auto pt-14">
          <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

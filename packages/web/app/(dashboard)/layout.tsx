import React from 'react';
import { Sidebar } from '@/components/layout/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full gap-3 p-3">
      <div className="flex h-full w-65 flex-col overflow-hidden rounded-xl ">
        <Sidebar />
      </div>

      <main className="flex h-full flex-1 flex-col overflow-y-auto rounded-xl">
        <div className="mx-auto w-full max-w-7xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}

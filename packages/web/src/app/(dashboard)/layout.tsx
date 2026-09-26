import { type ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { getServerUser } from '@/features/auth/server';
import { DashboardShell } from '@/shared/components/layout/dashboard-shell';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getServerUser();

  if (!user) {
    redirect('/login');
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}

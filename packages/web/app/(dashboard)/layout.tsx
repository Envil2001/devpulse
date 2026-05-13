'use client';

import {
  BarChart3,
  CalendarDays,
  Download,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  Plus,
  Settings,
  LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { clearAccessToken, getAccessToken } from '@/lib/auth-storage';

const navigationItems = [
  { label: 'Overview', active: true, icon: LayoutDashboard },
  { label: 'Projects', active: false, icon: FolderKanban },
  { label: 'Branches', active: false, icon: GitBranch },
  { label: 'Reports', active: false, icon: BarChart3 },
  { label: 'Settings', active: false, icon: Settings },
];

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  useEffect(() => {
    const token = getAccessToken();
    if (token === null) {
      router.replace('/login');
    }
  }, [router]);

  const handleLogout = (): void => {
    clearAccessToken();
    router.replace('/login');
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1440px] grid-cols-1 gap-4 md:grid-cols-[280px_1fr] md:gap-6">
        <aside className="card-shell rounded-xl p-4 md:p-5">
          <div className="rounded-lg bg-(--color-primary-soft) px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-(--color-text-muted)">
              DevPulse
            </p>
            <p className="text-lg font-semibold text-(--color-text)">Dashboard</p>
          </div>

          <nav className="mt-5 flex flex-col gap-2">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-(--color-primary) text-white'
                    : 'text-(--color-text-muted) hover:bg-(--color-surface-muted) hover:text-(--color-text)'
                }`}
              >
                <span className="flex items-center gap-2">
                  <item.icon size={16} strokeWidth={2} />
                  <span>{item.label}</span>
                </span>
              </button>
            ))}
          </nav>

          <div className="mt-6 rounded-lg border border-(--color-border) bg-(--color-surface-muted) p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-(--color-text-muted)">
              Workspace
            </p>
            <p className="mt-1 text-sm font-semibold text-(--color-text)">devpulse</p>
            <p className="mt-1 text-xs text-(--color-text-muted)">Weekly focus: 82.4%</p>
          </div>
        </aside>

        <section className="card-shell rounded-xl p-4 md:p-5">
          <header className="rounded-lg border border-(--color-border) bg-(--color-surface-muted) px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-(--color-text-muted)">
                  <CalendarDays size={14} strokeWidth={2} />
                  Today
                </p>
                <h1 className="text-lg font-semibold text-(--color-text)">Engineering Dashboard</h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="ui-button-primary inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  New Report
                </button>
                <button
                  type="button"
                  disabled
                  className="ui-button-primary inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold"
                >
                  <Download size={16} strokeWidth={2.5} />
                  Export (disabled)
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-lg border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm font-semibold text-(--color-text) transition-colors hover:bg-(--color-surface-muted)"
                >
                  <LogOut size={16} strokeWidth={2.5} />
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="mt-4">{children}</main>
        </section>
      </div>
    </div>
  );
}

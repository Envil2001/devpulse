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
      <div className="max-w-360 mx-auto grid min-h-[calc(100vh-2rem)] grid-cols-1 gap-4 md:grid-cols-[280px_1fr] md:gap-6">
        <aside className="card-shell rounded-xl p-4 md:p-5">
          <div className="bg-(--color-primary-soft) rounded-lg px-3 py-2">
            <p className="text-(--color-text-muted) text-xs font-semibold uppercase tracking-wide">
              DevPulse
            </p>
            <p className="text-(--color-text) text-lg font-semibold">Dashboard</p>
          </div>

          <nav className="mt-5 flex flex-col gap-2">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-(--color-primary) text-white'
                    : 'text-(--color-text-muted) hover:bg-(--color-surface-muted) hover:text-(--color-text)'
                }`}
                type="button"
              >
                <span className="flex items-center gap-2">
                  <item.icon size={16} strokeWidth={2} />
                  <span>{item.label}</span>
                </span>
              </button>
            ))}
          </nav>

          <div className="border-(--color-border) bg-(--color-surface-muted) mt-6 rounded-lg border p-3">
            <p className="text-(--color-text-muted) text-xs font-medium uppercase tracking-wide">
              Workspace
            </p>
            <p className="text-(--color-text) mt-1 text-sm font-semibold">devpulse</p>
            <p className="text-(--color-text-muted) mt-1 text-xs">Weekly focus: 82.4%</p>
          </div>
        </aside>

        <section className="card-shell rounded-xl p-4 md:p-5">
          <header className="border-(--color-border) bg-(--color-surface-muted) rounded-lg border px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-(--color-text-muted) flex items-center gap-1 text-xs font-medium uppercase tracking-wide">
                  <CalendarDays size={14} strokeWidth={2} />
                  Today
                </p>
                <h1 className="text-(--color-text) text-lg font-semibold">Engineering Dashboard</h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="ui-button-primary inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold"
                  type="button"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  New Report
                </button>
                <button
                  disabled
                  className="ui-button-primary inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold"
                  type="button"
                >
                  <Download size={16} strokeWidth={2.5} />
                  Export (disabled)
                </button>
                <button
                  className="border-(--color-border) bg-(--color-surface) text-(--color-text) hover:bg-(--color-surface-muted) inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors"
                  type="button"
                  onClick={handleLogout}
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

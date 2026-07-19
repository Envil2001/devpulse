'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, History, Wallet, Settings, LogOut } from 'lucide-react';
import { cn } from '@/utils/cn';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Sessions', href: '/sessions', icon: History },
  { name: 'Earnings', href: '/earnings', icon: Wallet },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col bg-neutral-900 px-4 py-6">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="h-4 w-4 rounded-full border-2 border-green-spring shadow-[0_0_10px_rgba(21,255,171,0.35)]" />
        <span className="h6 text-neutral-100">DevPulse</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                isActive
                  ? 'bg-neutral-700/50 text-neutral-100'
                  : 'text-neutral-100 hover:bg-neutral-700/70 hover:text-neutral-200',
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  isActive ? 'text-green-spring' : 'text-neutral-500 group-hover:text-neutral-400',
                )}
              />
              <span className="body2">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-neutral-800 pt-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-neutral-400 transition-colors hover:bg-neutral-800/50 hover:text-neutral-200">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-blue/20 body2 text-purple-blue">
            JD
          </div>

          <div className="flex flex-1 flex-col items-start text-left">
            <span className="body2 text-neutral-100">John Doe</span>
            <span className="mini text-neutral-500">Pro Plan</span>
          </div>

          <LogOut className="h-4 w-4 text-neutral-600 transition-colors group-hover:text-red-fluor" />
        </button>
      </div>
    </aside>
  );
}

'use client';

import { LayoutDashboard, FolderKanban, History, Wallet, Settings } from 'lucide-react';
import { NavItem } from './nav-item';

const mainNavItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Sessions', href: '/sessions', icon: History },
  { name: 'Earnings', href: '/earnings', icon: Wallet },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarNavProps {
  onNavClick?: () => void;
}

export function SidebarNav({ onNavClick }: SidebarNavProps) {
  return (
    <nav className="flex flex-1 flex-col overflow-y-auto scroll-subtle px-3 pb-3 pt-1.5">
      <ul className="flex flex-col gap-1" aria-label="Main navigation">
        {mainNavItems.map((item) => (
          <li key={item.name}>
            <NavItem href={item.href} icon={item.icon} label={item.name} onClick={onNavClick} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

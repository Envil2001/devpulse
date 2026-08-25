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
    <nav className="flex-1 overflow-y-auto py-4 px-3">
      <div className="space-y-1">
        {mainNavItems.map((item) => (
          <NavItem
            key={item.name}
            href={item.href}
            icon={item.icon}
            label={item.name}
            onClick={onNavClick}
          />
        ))}
      </div>
    </nav>
  );
}

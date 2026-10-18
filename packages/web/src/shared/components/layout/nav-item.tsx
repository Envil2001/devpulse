'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/cn';
import type { LucideIcon } from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  isCollapsed?: boolean;
}

export function NavItem({ href, icon: Icon, label, onClick, isCollapsed }: NavItemProps) {
  const pathname = usePathname();
  const isActive =
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group flex h-8 items-center rounded-[10px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/20',
        isCollapsed ? 'justify-center px-0' : 'gap-2 px-2',
        isActive
          ? 'bg-white/[0.06] text-foreground'
          : 'text-secondary hover:bg-white/[0.04] hover:text-foreground',
      )}
    >
      <Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" strokeWidth={1.5} />
      {!isCollapsed && <span className="truncate text-sm font-medium">{label}</span>}
    </Link>
  );
}

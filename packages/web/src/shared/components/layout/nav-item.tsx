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
}

export function NavItem({ href, icon: Icon, label, onClick }: NavItemProps) {
  const pathname = usePathname();
  const isActive =
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group flex h-9 items-center gap-2 rounded-[10px] px-2 text-sm font-medium outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-white/15',
        isActive
          ? 'bg-gray-alpha-100 text-foreground'
          : 'text-secondary hover:bg-gray-alpha-100 hover:text-foreground',
      )}
    >
      <span className="flex h-8 min-w-5 -mx-0.5 items-center justify-center">
        <Icon
          aria-hidden="true"
          strokeWidth={1.5}
          className={cn(
            'h-4.5 w-4.5 shrink-0 transition-colors',
            isActive ? 'text-foreground' : 'text-subtle group-hover:text-secondary',
          )}
        />
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

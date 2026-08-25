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
        'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150',
        'outline-none focus-visible:ring-2 focus-visible:ring-white/20',
        isActive
          ? 'bg-white/5 text-green-spring'
          : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-100',
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          'h-4.5 w-4.5 shrink-0 transition-colors',
          isActive ? 'text-green-spring' : 'text-neutral-500 group-hover:text-neutral-300',
        )}
      />
      <span className="truncate">{label}</span>

      {isActive && (
        <div
          aria-hidden="true"
          className="ml-auto h-1.5 w-1.5 rounded-full bg-green-spring shadow-[0_0_6px_rgba(21,255,171,0.6)]"
        />
      )}
    </Link>
  );
}

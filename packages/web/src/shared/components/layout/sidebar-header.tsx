'use client';

import Link from 'next/link';
import { cn } from '@/shared/lib/cn';

interface SidebarHeaderProps {
  isCollapsed?: boolean;
}

export function SidebarHeader({ isCollapsed }: SidebarHeaderProps) {
  return (
    <div className="flex h-14 shrink-0 items-center px-3">
      <Link
        href="/"
        className={cn(
          'flex h-9 items-center gap-2 rounded-[10px] px-2 outline-none transition-colors hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-white/15',
          isCollapsed && 'justify-center w-full px-0',
        )}
      >
        <span
          aria-hidden="true"
          className="h-3 w-3 shrink-0 rounded-full bg-brand shadow-[0_0_10px_var(--color-brand-glow)]"
        />
        {!isCollapsed && (
          <span className="text-sm font-medium tracking-tight text-foreground truncate">
            DevPulse
          </span>
        )}
      </Link>
    </div>
  );
}

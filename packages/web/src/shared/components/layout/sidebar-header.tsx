'use client';

import Link from 'next/link';

export function SidebarHeader() {
  return (
    <div className="flex h-14 shrink-0 items-center px-3">
      <Link
        href="/"
        className="flex h-9 items-center gap-2 rounded-[10px] px-2 outline-none transition-colors hover:bg-gray-alpha-100 focus-visible:ring-2 focus-visible:ring-white/15"
      >
        <span
          aria-hidden="true"
          className="h-3 w-3 rounded-full bg-brand shadow-[0_0_10px_var(--color-brand-glow)]"
        />
        <span className="text-sm font-medium tracking-tight text-foreground">DevPulse</span>
      </Link>
    </div>
  );
}

'use client';

import Link from 'next/link';

export function SidebarHeader() {
  return (
    <div className="flex h-14 shrink-0 items-center gap-3 border-b border-white/5 px-4">
      <Link
        href="/"
        className="flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-green-spring/50 rounded-lg"
      >
        <div className="h-3 w-3 rounded-full bg-green-spring shadow-[0_0_12px_rgba(21,255,171,0.4)]" />
        <span className="text-sm font-semibold tracking-tight text-neutral-100">DevPulse</span>
      </Link>
    </div>
  );
}

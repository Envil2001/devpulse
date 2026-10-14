'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Menu, X } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/components/ui/button';
import { UserMenu } from '@/shared/components/ui/user-menu';
import { CommandMenu } from '../ui/command-menu';

interface HeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export function Header({ onMenuToggle, isMenuOpen }: HeaderProps) {
  const pathname = usePathname();
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard';
    if (pathname.startsWith('/projects')) return 'Projects';
    if (pathname.startsWith('/sessions')) return 'Sessions';
    if (pathname.startsWith('/earnings')) return 'Earnings';
    if (pathname.startsWith('/settings')) return 'Settings';
    return 'DevPulse';
  };

  return (
    <header
      className={cn(
        'fixed left-0 right-0 top-0 z-30 h-12 border-b border-border',
        'bg-background/90 backdrop-blur-sm',
        'lg:left-64',
      )}
    >
      <div className="grid h-12 grid-cols-[1fr_minmax(0,auto)_1fr] items-center gap-2 px-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle sidebar"
            className="hidden lg:inline-flex"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect
                x="7"
                y="6.5"
                width="7"
                height="1.5"
                rx="0.75"
                transform="rotate(90 7 6.5)"
                fill="currentColor"
              />
              <rect
                x="3"
                y="4"
                width="14"
                height="12"
                rx="2.8"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
            className="lg:hidden"
          >
            {isMenuOpen ? (
              <X strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <Menu strokeWidth={1.5} aria-hidden="true" />
            )}
          </Button>

          <div className="flex min-w-0 items-center gap-1.5">
            <h1 className="truncate text-sm font-medium text-foreground">{getPageTitle()}</h1>
            <span className="hidden h-5 shrink-0 items-center rounded-full border border-transparent bg-gray-alpha-150 px-2 text-[11px] font-medium text-foreground sm:inline-flex">
              Alpha
            </span>
          </div>
        </div>

        <button
          type="button"
          aria-label="Global search"
          onClick={() => setIsCommandOpen(true)}
          className="group hidden h-8 w-64 max-w-full items-center justify-between gap-4 rounded-xl border border-gray-alpha-200 bg-background pl-2 pr-1.75 text-secondary outline-none transition-colors hover:border-gray-alpha-300 hover:bg-gray-alpha-50 focus-visible:ring-2 focus-visible:ring-white/15 lg:flex"
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <Search
              className="h-4.5 w-4.5 shrink-0 text-subtle transition-colors group-hover:text-secondary"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <span className="truncate text-[13px] font-normal">Search everything...</span>
          </span>

          <span className="flex shrink-0 gap-1" aria-hidden="true">
            <kbd className="flex h-4.5 w-fit items-center justify-center rounded-md border border-foreground/15 bg-gray-alpha-50 px-1 text-[11px] font-medium text-secondary">
              ⌘
            </kbd>
            <kbd className="flex h-4.5 w-fit items-center justify-center rounded-md border border-foreground/15 bg-gray-alpha-50 px-1 text-[11px] font-medium text-secondary">
              K
            </kbd>
          </span>
        </button>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            asChild
            className="hidden rounded-[0.6rem] px-2.5 text-[13px] lg:inline-flex"
          >
            <Link href="/docs">Docs</Link>
          </Button>

          <UserMenu />
        </div>
      </div>

      <CommandMenu open={isCommandOpen} onOpenChange={setIsCommandOpen} />
    </header>
  );
}

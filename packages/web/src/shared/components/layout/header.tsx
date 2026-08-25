'use client';

import { usePathname } from 'next/navigation';
import { Search, Menu, X } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { inputVariants } from '@/shared/components/ui/input';
import { UserMenu } from '@/shared/components/ui/user-menu';
import { cn } from '@/shared/lib/cn';

interface HeaderProps {
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export function Header({ onMenuToggle, isMenuOpen }: HeaderProps) {
  const pathname = usePathname();

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
        'fixed top-0 right-0 z-30 h-14 border-b border-white/5',
        'bg-neutral-950/80 backdrop-blur-md transition-[left] duration-200',
        'left-0 lg:left-64',
      )}
    >
      <div className="flex h-full items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="lg:hidden text-neutral-400 hover:text-neutral-100"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>

          <h1 className="body-base font-semibold truncate">{getPageTitle()}</h1>
        </div>

        <div className="hidden lg:flex flex-1 justify-center max-w-md mx-auto">
          <button
            type="button"
            aria-label="Global search"
            className={cn(
              inputVariants(),
              'group flex items-center justify-between gap-3 text-neutral-400 hover:text-neutral-200 cursor-pointer',
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search
                className="h-4 w-4 shrink-0 text-neutral-500 transition-colors group-hover:text-neutral-300"
                aria-hidden="true"
              />
              <span className="truncate">Search everything...</span>
            </div>

            <div className="flex items-center gap-1 shrink-0" aria-hidden="true">
              <kbd className="hidden sm:inline-flex h-5 items-center justify-center rounded-md border border-white/10 bg-neutral-800 px-1.5 mono-sm text-[10px] text-neutral-400">
                ⌘
              </kbd>
              <kbd className="hidden sm:inline-flex h-5 items-center justify-center rounded-md border border-white/10 bg-neutral-800 px-1.5 mono-sm text-[10px] text-neutral-400">
                K
              </kbd>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button variant="secondary" size="sm" className="hidden md:inline-flex">
            Feedback
          </Button>
          <Button variant="secondary" size="sm" className="hidden md:inline-flex" asChild>
            <a href="/docs" target="_blank" rel="noreferrer">
              Docs
            </a>
          </Button>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}

'use client';

import { cn } from '@/shared/lib/cn';
import { SidebarHeader } from './sidebar-header';
import { SidebarNav } from './sidebar-nav';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose?.();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        aria-label="Main Navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col',
          'border-r border-white/5 bg-neutral-950/95 backdrop-blur-xl',
          'transition-transform duration-300 ease-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarHeader />
        <SidebarNav onNavClick={handleNavClick} />
      </aside>
    </>
  );
}

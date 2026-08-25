'use client';

import Link from 'next/link';
import { LogOut, Settings, BookOpen } from 'lucide-react';
import { useRequireAuth } from '@/features/auth/context';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';

export function UserMenu() {
  const { user, logout, isLoading } = useRequireAuth();

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  if (isLoading || !user) {
    return (
      <div className="h-9 w-9 rounded-full bg-neutral-800 animate-pulse" />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/20 transition-transform active:scale-95"
          aria-label="User menu"
        >
          <Avatar className="hover:bg-purple-blue/20 transition-colors">
            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <div className="p-1 mb-1">
          <div className="flex flex-col gap-1 rounded-lg bg-neutral-900 border border-white/5 p-2.5 shadow-sm">
            <span className="body-base truncate">{user.displayName}</span>
            <span className="caption truncate">{user.email}</span>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4 text-neutral-400" aria-hidden="true" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <a href="/docs" target="_blank" rel="noreferrer">
              <BookOpen className="mr-2 h-4 w-4 text-neutral-400" aria-hidden="true" />
              <span>Docs and resources</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => logout()}
          className="text-neutral-300 hover:text-red-coral! hover:bg-red-coral/10! focus:text-red-coral! focus:bg-red-coral/10!"
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

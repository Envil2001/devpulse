'use client';

import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { LayoutDashboard, FolderGit2, Clock, DollarSign, Settings, BookOpen } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle } from '@/shared/components/ui/dialog';
import { cn } from '@/shared/lib/cn';
import { useCallback, useEffect } from 'react';

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const runCommand = useCallback(
    (command: () => void) => {
      onOpenChange(false);
      command();
    },
    [onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 max-w-2xl bg-neutral-950/90 backdrop-blur-xl border-white/10 shadow-2xl">
        <DialogTitle className="sr-only">Navigation Menu</DialogTitle>

        <Command className="flex h-full w-full flex-col overflow-hidden bg-transparent">
          <div className="flex items-center border-b border-white/5 px-3">
            <Command.Input
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm text-neutral-100 outline-none placeholder:text-neutral-500"
              placeholder="Type a command or search..."
            />
          </div>

          <Command.List className="max-h-75 overflow-y-auto overflow-x-hidden p-2">
            <Command.Empty className="py-6 text-center text-sm text-neutral-500">
              No results found.
            </Command.Empty>

            <Command.Group
              heading="Pages"
              className="px-2 py-1.5 text-xs font-medium text-neutral-500 label-caps"
            >
              <CommandItem onSelect={() => runCommand(() => router.push('/'))}>
                <LayoutDashboard className="mr-2 h-4 w-4 text-neutral-400" />
                Dashboard
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/projects'))}>
                <FolderGit2 className="mr-2 h-4 w-4 text-neutral-400" />
                Projects
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/sessions'))}>
                <Clock className="mr-2 h-4 w-4 text-neutral-400" />
                Sessions
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/earnings'))}>
                <DollarSign className="mr-2 h-4 w-4 text-neutral-400" />
                Earnings
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
                <Settings className="mr-2 h-4 w-4 text-neutral-400" />
                Settings
              </CommandItem>
            </Command.Group>

            <Command.Group
              heading="External"
              className="px-2 py-1.5 text-xs font-medium text-neutral-500 label-caps mt-2"
            >
              <CommandItem onSelect={() => runCommand(() => window.open('/docs', '_blank'))}>
                <BookOpen className="mr-2 h-4 w-4 text-neutral-400" />
                Docs and resources
              </CommandItem>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandItem({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-2.5 text-sm text-neutral-200 outline-none transition-colors',
        'data-[selected=true]:bg-white/10 data-[selected=true]:text-neutral-50',
      )}
    >
      {children}
    </Command.Item>
  );
}

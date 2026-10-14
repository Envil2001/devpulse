'use client';

import { TerminalSquare } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelDescription,
  PanelContent,
} from '@/shared/components/layout/panel';
import { useLanguagesBreakdown } from '../hooks';

export function LanguagesPanel() {
  const { data, isLoading } = useLanguagesBreakdown();

  return (
    <Panel>
      <PanelHeader>
        <div>
          <PanelTitle>Languages</PanelTitle>
          <PanelDescription>Your technology stack</PanelDescription>
        </div>
      </PanelHeader>

      <PanelContent className="flex flex-col">
        <div className="mb-2 grid grid-cols-12 gap-4 border-b border-border pb-2 text-xs font-medium uppercase tracking-wider text-subtle">
          <div className="col-span-8">Language</div>
          <div className="col-span-4 text-right">Active Time</div>
        </div>

        {isLoading && (
          <div className="py-8 text-center">
            <span className="animate-pulse text-sm text-secondary">Loading…</span>
          </div>
        )}

        {!isLoading && (!data || data.languages.length === 0) && (
          <div className="py-8 text-center">
            <span className="text-sm text-secondary">No data</span>
          </div>
        )}

        {data?.languages.map((lang, i) => (
          <div
            key={lang.language}
            className={cn(
              'relative grid grid-cols-12 items-center gap-4 py-3 text-sm transition-colors',
              '-mx-2 rounded-lg px-2 hover:bg-gray-alpha-50',
              i !== data.languages.length - 1 &&
                'after:pointer-events-none after:absolute after:inset-x-2 after:bottom-0 after:h-px after:bg-border',
            )}
          >
            <div className="col-span-8 flex min-w-0 flex-col gap-1.5">
              <div className="flex items-center gap-2 truncate">
                <TerminalSquare
                  className="h-4 w-4 shrink-0 text-subtle"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <span className="truncate text-sm font-medium capitalize text-foreground">
                  {lang.language}
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-gray-alpha-100">
                <div
                  className="h-full bg-brand transition-all duration-500"
                  style={{ width: `${lang.percentage}%` }}
                />
              </div>
            </div>

            <div className="col-span-4 flex flex-col items-end justify-center gap-0.5 text-right font-mono text-xs tabular-nums">
              <span className="text-foreground">{lang.formattedTime}</span>
              <span className="text-subtle">{lang.percentage}%</span>
            </div>
          </div>
        ))}
      </PanelContent>
    </Panel>
  );
}

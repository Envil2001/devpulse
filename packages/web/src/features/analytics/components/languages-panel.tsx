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
        <div className="label-caps mb-2 grid grid-cols-12 gap-4 border-b border-white/5 pb-2">
          <div className="col-span-8">LANGUAGE</div>
          <div className="col-span-4 text-right">ACTIVE TIME</div>
        </div>

        {isLoading && (
          <div className="py-8 text-center">
            <span className="body-muted animate-pulse">Loading…</span>
          </div>
        )}
        {!isLoading && (!data || data.languages.length === 0) && (
          <div className="py-8 text-center">
            <span className="body-muted">No data</span>
          </div>
        )}

        {data?.languages.map((lang, i) => (
          <div
            key={lang.language}
            className={cn(
              'grid grid-cols-12 items-center gap-4 py-3 text-sm transition-colors',
              i !== data.languages.length - 1 && 'border-b border-white/5',
              'hover:bg-white/2 -mx-2 rounded-lg px-2',
            )}
          >
            <div className="col-span-8 flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 truncate">
                <TerminalSquare className="h-4 w-4 shrink-0 text-neutral-500" />
                <span className="body-base capitalize truncate">{lang.language}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full bg-green-spring/70 transition-all duration-500"
                  style={{ width: `${lang.percentage}%` }}
                />
              </div>
            </div>
            <div className="mono-sm col-span-4 flex flex-col items-end justify-center text-right">
              <span className="text-neutral-200">{lang.formattedTime}</span>
              <span className="text-xs text-neutral-500">{lang.percentage}%</span>
            </div>
          </div>
        ))}
      </PanelContent>
    </Panel>
  );
}

'use client';

import { Clock, GitBranch, TerminalSquare } from 'lucide-react';

import { cn } from '@/shared/lib/cn';
import {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelDescription,
  PanelContent,
} from '@/shared/components/layout/panel';
import { useRequireAuth } from '@/features/auth/context';

import { useRecentSessions } from '../hooks';
import { formatDuration } from './sessions-summary-cards';

const RECENT_LIMIT = 5;

function formatTimeRange(
  startedAt: string,
  endedAt: string,
  timezone: string,
  isActive: boolean,
): string {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
    hour12: false,
  });

  const start = fmt.format(new Date(startedAt));
  const end = isActive ? 'now' : fmt.format(new Date(endedAt));

  return `${start} → ${end}`;
}

function focusColorClass(score: number): string {
  if (score >= 80) return 'text-green-spring';
  if (score >= 50) return 'text-yellow-400';
  return 'text-red-coral';
}

export function RecentSessionsPanel() {
  const { user } = useRequireAuth();
  const { data: sessions = [], isLoading } = useRecentSessions(RECENT_LIMIT);

  return (
    <Panel>
      <PanelHeader>
        <div>
          <PanelTitle>Recent sessions</PanelTitle>
          <PanelDescription>Your latest tracked activity</PanelDescription>
        </div>
      </PanelHeader>

      <PanelContent className="flex flex-col">
        <div className="label-caps mb-2 grid grid-cols-12 gap-4 border-b border-white/5 pb-2">
          <div className="col-span-3">TIME</div>
          <div className="col-span-4">BRANCH</div>
          <div className="col-span-3">LANGUAGE</div>
          <div className="col-span-2 text-right">FOCUS</div>
        </div>

        {isLoading && (
          <div className="py-8 text-center">
            <span className="body-muted animate-pulse">Loading…</span>
          </div>
        )}

        {!isLoading && sessions.length === 0 && (
          <div className="py-8 text-center">
            <span className="body-muted">No sessions yet</span>
          </div>
        )}

        {sessions.map((session, i) => (
          <div
            key={session.id}
            className={cn(
              'grid grid-cols-12 items-center gap-4 py-3.5 text-sm transition-colors',
              i !== sessions.length - 1 && 'border-b border-white/5',
              'hover:bg-white/2 -mx-2 rounded-lg px-2',
            )}
          >
            <div className="mono-sm col-span-3 flex items-center gap-2 text-neutral-300">
              <Clock className="h-3.5 w-3.5 shrink-0 text-neutral-500" aria-hidden="true" />
              <span className="truncate">
                {formatTimeRange(
                  session.startedAt,
                  session.endedAt,
                  user.timezone,
                  session.status === 'active',
                )}
              </span>
            </div>

            <div className="col-span-4 flex min-w-0 items-center">
              <span className="mono-sm inline-flex items-center gap-1 truncate rounded-md border border-white/5 bg-neutral-950/40 px-2 py-0.5">
                <GitBranch className="h-3 w-3 shrink-0 text-neutral-500" aria-hidden="true" />
                <span className="truncate">{session.gitBranch ?? 'main'}</span>
              </span>
            </div>

            <div className="col-span-3 flex min-w-0 items-center gap-1.5">
              {session.primaryLanguage ? (
                <>
                  <TerminalSquare
                    className="h-3.5 w-3.5 shrink-0 text-neutral-500"
                    aria-hidden="true"
                  />
                  <span className="body-base capitalize truncate">{session.primaryLanguage}</span>
                </>
              ) : (
                <span className="body-muted">—</span>
              )}
            </div>

            <div className="col-span-2 flex flex-col items-end justify-center text-right">
              <span className="mono-sm text-neutral-200">{formatDuration(session.durationMs)}</span>
              <span className={cn('mono-sm text-xs', focusColorClass(session.focusScore))}>
                {session.focusScore}%
              </span>
            </div>
          </div>
        ))}
      </PanelContent>
    </Panel>
  );
}

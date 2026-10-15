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
import { formatDuration } from '@devpulse/lib';

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
  if (score >= 80) return 'text-brand';
  if (score >= 50) return 'text-yellow-amber';
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
        <div className="mb-2 grid grid-cols-12 gap-4 border-b border-border pb-2 text-xs font-medium uppercase tracking-wider text-subtle">
          <div className="col-span-3">Time</div>
          <div className="col-span-4">Branch</div>
          <div className="col-span-3">Language</div>
          <div className="col-span-2 text-right">Focus</div>
        </div>

        {isLoading && (
          <div className="py-8 text-center">
            <span className="animate-pulse text-sm text-secondary">Loading…</span>
          </div>
        )}

        {!isLoading && sessions.length === 0 && (
          <div className="py-8 text-center">
            <span className="text-sm text-secondary">No sessions yet</span>
          </div>
        )}

        {sessions.map((session, i) => (
          <div
            key={session.id}
            className={cn(
              'relative grid grid-cols-12 items-center gap-4 py-3.5 text-sm transition-colors',
              '-mx-2 rounded-lg px-2 hover:bg-gray-alpha-50',
              i !== sessions.length - 1 &&
                'after:pointer-events-none after:absolute after:inset-x-2 after:bottom-0 after:h-px after:bg-border',
            )}
          >
            <div className="col-span-3 flex items-center gap-2 font-mono text-xs text-secondary tabular-nums">
              <Clock
                className="h-3.5 w-3.5 shrink-0 text-subtle"
                strokeWidth={1.5}
                aria-hidden="true"
              />
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
              <span className="inline-flex items-center gap-1 truncate rounded-md border border-border bg-gray-alpha-50 px-2 py-0.5 font-mono text-xs text-secondary">
                <GitBranch
                  className="h-3 w-3 shrink-0 text-subtle"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <span className="truncate">{session.gitBranch ?? 'main'}</span>
              </span>
            </div>

            <div className="col-span-3 flex min-w-0 items-center gap-1.5">
              {session.primaryLanguage ? (
                <>
                  <TerminalSquare
                    className="h-3.5 w-3.5 shrink-0 text-subtle"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <span className="truncate text-sm font-medium capitalize text-foreground">
                    {session.primaryLanguage}
                  </span>
                </>
              ) : (
                <span className="text-sm text-secondary">—</span>
              )}
            </div>

            <div className="col-span-2 flex flex-col items-end justify-center text-right">
              <span className="font-mono text-xs text-foreground tabular-nums">
                {formatDuration(session.durationMs)}
              </span>
              <span
                className={cn(
                  'font-mono text-xs font-medium tabular-nums',
                  focusColorClass(session.focusScore),
                )}
              >
                {session.focusScore}%
              </span>
            </div>
          </div>
        ))}
      </PanelContent>
    </Panel>
  );
}

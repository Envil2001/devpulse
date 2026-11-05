'use client';

import { ChevronRight, Clock, GitBranch, TerminalSquare } from 'lucide-react';
import Link from 'next/link';
import { formatInTimeZone } from 'date-fns-tz';
import { cn } from '@/shared/lib/cn';
import { formatTimeRange } from '@/shared/lib/date';
import {
  Panel,
  PanelHeader,
  PanelTitle,
  PanelDescription,
  PanelContent,
} from '@/shared/components/layout/panel';
import type { WorkSessionSummary } from '@/shared/types';
import { useRequireAuth } from '@/features/auth/context';

import { RECENT_SESSIONS_LIMIT, useRecentSessions } from '../hooks';
import { formatDuration } from '@devpulse/lib';

/** A focus score of a session shorter than this says nothing: 6 seconds of typing is "100%". */
const MIN_SECONDS_FOR_FOCUS = 5 * 60;

const SHORT_DAY_LABEL_FORMAT = 'EEE, MMM d';

function formatSessionTime(session: WorkSessionSummary, timezone: string): string {
  const startedAt = new Date(session.startedAt);
  const range = formatTimeRange(
    session.startedAt,
    session.isLive ? null : session.endedAt,
    timezone,
  );

  return `${formatInTimeZone(startedAt, timezone, SHORT_DAY_LABEL_FORMAT)} · ${range}`;
}

function focusColorClass(score: number): string {
  if (score >= 80) return 'text-brand';
  if (score >= 50) return 'text-yellow-amber';
  return 'text-red-coral';
}

export function RecentSessionsPanel({ projectId }: { projectId?: string }) {
  const { user } = useRequireAuth();
  const {
    data: sessions = [],
    isLoading,
    isError,
  } = useRecentSessions(RECENT_SESSIONS_LIMIT, projectId);

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
          <div className="col-span-2 text-right">Active / focus</div>
        </div>

        {isLoading && (
          <div className="py-8 text-center">
            <span className="animate-pulse text-sm text-secondary">Loading…</span>
          </div>
        )}

        {isError && (
          <div className="py-8 text-center">
            <span className="text-sm text-red-coral">Could not load sessions</span>
          </div>
        )}

        {!isLoading && !isError && sessions.length === 0 && (
          <div className="py-8 text-center">
            <span className="text-sm text-secondary">No sessions yet</span>
          </div>
        )}

        {sessions.map((session, i) => (
          <Link
            key={session.id}
            href={`/sessions/${session.id}`}
            className={cn(
              'group relative grid grid-cols-12 items-center gap-4 py-3.5 text-sm transition-colors',
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
              <span className="truncate">{formatSessionTime(session, user.timezone)}</span>
            </div>

            <div className="col-span-4 flex min-w-0 items-center">
              <span className="inline-flex items-center gap-1 truncate rounded-md border border-border bg-gray-alpha-50 px-2 py-0.5 font-mono text-xs text-secondary">
                <GitBranch
                  className="h-3 w-3 shrink-0 text-subtle"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <span className="truncate">{session.gitBranch ?? '—'}</span>
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
              <span
                className={cn(
                  'font-mono text-xs tabular-nums',
                  session.durationSeconds === 0 ? 'text-subtle' : 'text-foreground',
                )}
              >
                {session.durationSeconds === 0 ? 'idle' : formatDuration(session.durationSeconds)}
              </span>
              {session.durationSeconds >= MIN_SECONDS_FOR_FOCUS ? (
                <span
                  className={cn(
                    'font-mono text-xs font-medium tabular-nums',
                    focusColorClass(session.focusScore),
                  )}
                >
                  {session.focusScore}%
                </span>
              ) : (
                <span className="font-mono text-xs text-subtle">—</span>
              )}
            </div>

            <ChevronRight
              className="absolute right-1 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle opacity-0 transition-opacity group-hover:opacity-100"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </Link>
        ))}
      </PanelContent>
    </Panel>
  );
}

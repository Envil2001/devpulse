'use client';

import { useMemo } from 'react';
import { Clock, Zap, Layers, FolderGit2 } from 'lucide-react';
import { formatDuration } from '@devpulse/lib';
import { WorkSessionSummary } from '@/shared/types';

interface SessionsSummaryCardsProps {
  sessions: WorkSessionSummary[];
  isLoading: boolean;
  uniqueProjectsCount: number;
}

export function SessionsSummaryCards({
  sessions,
  isLoading,
  uniqueProjectsCount,
}: SessionsSummaryCardsProps) {
  const totalSeconds = useMemo(() => {
    return sessions.reduce((acc, s) => acc + (s.durationMs ?? 0), 0);
  }, [sessions]);

  const avgFocus = useMemo(() => {
    if (!sessions.length) return 0;
    return Math.round(sessions.reduce((acc, s) => acc + (s.focusScore ?? 0), 0) / sessions.length);
  }, [sessions]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="flex flex-col rounded-xl border border-border bg-surface p-4">
        <span className="flex items-center gap-1.5 text-xs text-subtle">
          <Clock className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
          Total Time
        </span>
        <span className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">
          {isLoading ? '—' : formatDuration(totalSeconds)}
        </span>
      </div>

      <div className="flex flex-col rounded-xl border border-border bg-surface p-4">
        <span className="flex items-center gap-1.5 text-xs text-subtle">
          <Zap className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
          Avg Focus
        </span>
        <span className="mt-1 font-mono text-lg font-semibold tabular-nums text-brand">
          {isLoading ? '—' : `${avgFocus}%`}
        </span>
      </div>

      <div className="flex flex-col rounded-xl border border-border bg-surface p-4">
        <span className="flex items-center gap-1.5 text-xs text-subtle">
          <Layers className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
          Total Sessions
        </span>
        <span className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">
          {isLoading ? '—' : sessions.length}
        </span>
      </div>

      <div className="flex flex-col rounded-xl border border-border bg-surface p-4">
        <span className="flex items-center gap-1.5 text-xs text-subtle">
          <FolderGit2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
          Active Projects
        </span>
        <span className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">
          {isLoading ? '—' : uniqueProjectsCount}
        </span>
      </div>
    </div>
  );
}

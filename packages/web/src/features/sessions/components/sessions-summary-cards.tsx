'use client';

import { useMemo } from 'react';
import { Clock, Zap, Layers, FolderGit2 } from 'lucide-react';
import type { WorkSessionSummary } from '../api';

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m ${seconds % 60}s`;
}

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
  const totalMs = useMemo(() => {
    return sessions.reduce((acc, s) => acc + (s.durationMs ?? 0), 0);
  }, [sessions]);

  const avgFocus = useMemo(() => {
    if (!sessions.length) return 0;
    return Math.round(sessions.reduce((acc, s) => acc + (s.focusScore ?? 0), 0) / sessions.length);
  }, [sessions]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="flex flex-col rounded-xl border border-white/5 bg-neutral-900/50 p-4 backdrop-blur-sm">
        <span className="caption flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Total Time
        </span>
        <span className="metric mt-1 text-lg text-neutral-100">
          {isLoading ? '—' : formatDuration(totalMs)}
        </span>
      </div>

      <div className="flex flex-col rounded-xl border border-white/5 bg-neutral-900/50 p-4 backdrop-blur-sm">
        <span className="caption flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5" aria-hidden="true" /> Avg Focus
        </span>
        <span className="metric mt-1 text-lg text-green-spring">
          {isLoading ? '—' : `${avgFocus}%`}
        </span>
      </div>

      <div className="flex flex-col rounded-xl border border-white/5 bg-neutral-900/50 p-4 backdrop-blur-sm">
        <span className="caption flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" aria-hidden="true" /> Total Sessions
        </span>
        <span className="metric mt-1 text-lg text-neutral-100">
          {isLoading ? '—' : sessions.length}
        </span>
      </div>

      <div className="flex flex-col rounded-xl border border-white/5 bg-neutral-900/50 p-4 backdrop-blur-sm">
        <span className="caption flex items-center gap-1.5">
          <FolderGit2 className="h-3.5 w-3.5" aria-hidden="true" /> Active Projects
        </span>
        <span className="metric mt-1 text-lg text-neutral-100">
          {isLoading ? '—' : uniqueProjectsCount}
        </span>
      </div>
    </div>
  );
}

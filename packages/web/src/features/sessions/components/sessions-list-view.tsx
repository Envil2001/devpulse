'use client';

import { useState, useMemo } from 'react';
import { Clock, Zap, GitBranch, FolderGit2, Search, Layers, Calendar } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { cn } from '@/shared/lib/cn';
import { useSessions } from '../hooks';

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m ${seconds % 60}s`;
}

export function SessionsListView() {
  const { data: sessions = [], isLoading, error } = useSessions();

  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');

  const uniqueProjects = useMemo(() => {
    return Array.from(new Set(sessions.map((s) => s.projectName).filter(Boolean)));
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      const matchesSearch =
        s.projectName?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (s.gitBranch && s.gitBranch.toLowerCase().includes(searchQuery.toLowerCase().trim()));

      const matchesProject = projectFilter === 'all' || s.projectName === projectFilter;

      return matchesSearch && matchesProject;
    });
  }, [sessions, searchQuery, projectFilter]);

  const totalMs = useMemo(() => {
    return sessions.reduce((acc, s) => acc + (s.durationMs ?? 0), 0);
  }, [sessions]);

  const avgFocus = useMemo(() => {
    if (!sessions.length) return 0;
    return Math.round(sessions.reduce((acc, s) => acc + (s.focusScore ?? 0), 0) / sessions.length);
  }, [sessions]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="title-1">Sessions</h2>
        <p className="body-muted mt-1">
          Detailed log of your tracked development activity and focus metrics
        </p>
      </div>

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
            {isLoading ? '—' : uniqueProjects.length}
          </span>
        </div>
      </div>

      <div
        className={cn(
          'rounded-2xl border border-white/5 bg-neutral-900/50 p-6 backdrop-blur-sm',
          'transition-colors hover:border-white/10',
        )}
      >
        <div className="mb-4 flex flex-col items-center justify-between gap-3 border-b border-white/5 pb-4 sm:flex-row">
          <div className="flex w-full flex-1 items-center gap-2.5 sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
                aria-hidden="true"
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by project or branch..."
                className="pl-9"
              />
            </div>

            <div className="hidden w-44 shrink-0 sm:block">
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {uniqueProjects.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="caption flex items-center gap-2 self-end sm:self-auto">
            <span>Showing:</span>
            <span className="mono-sm text-neutral-100">
              {filteredSessions.length} of {sessions.length}
            </span>
          </div>
        </div>

        <div className="label-caps mb-2 grid grid-cols-12 gap-4 border-b border-white/5 pb-3">
          <div className="col-span-4 sm:col-span-3">Start Time</div>
          <div className="col-span-4 sm:col-span-3">Project</div>
          <div className="hidden sm:col-span-3 sm:block">Branch</div>
          <div className="col-span-2 sm:col-span-2">Duration</div>
          <div className="col-span-2 text-right sm:col-span-1">Focus</div>
        </div>

        {isLoading && (
          <div className="py-16 text-center">
            <span className="body-muted animate-pulse">Loading session history…</span>
          </div>
        )}

        {error && (
          <div className="py-8 text-center text-sm text-red-coral">
            Failed to load sessions: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        )}

        {!isLoading && !error && sessions.length === 0 && (
          <div className="py-12 text-center">
            <p className="body-muted">No sessions recorded yet.</p>
            <p className="caption mt-1">
              Make sure your VS Code extension is running to track your activity.
            </p>
          </div>
        )}

        {!isLoading && !error && sessions.length > 0 && filteredSessions.length === 0 && (
          <div className="py-12 text-center">
            <p className="body-muted">No sessions match your search filters.</p>
            {(searchQuery || projectFilter !== 'all') && (
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setProjectFilter('all');
                }}
                className="mt-2 text-neutral-400 hover:text-neutral-100"
              >
                Reset filters
              </Button>
            )}
          </div>
        )}

        {!isLoading && !error && filteredSessions.length > 0 && (
          <div className="flex flex-col">
            {filteredSessions.map((session, i) => (
              <div
                key={session.id}
                className={cn(
                  'grid grid-cols-12 items-center gap-4 py-3.5 text-sm transition-colors',
                  i !== filteredSessions.length - 1 && 'border-b border-white/5',
                  'rounded-lg -mx-2 px-2 hover:bg-white/2',
                )}
              >
                <div className="col-span-4 flex items-center gap-2 sm:col-span-3">
                  <Calendar
                    className="hidden h-3.5 w-3.5 shrink-0 text-neutral-500 sm:block"
                    aria-hidden="true"
                  />
                  <span className="mono-sm text-neutral-400">
                    {new Date(session.startedAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="body-base col-span-4 flex items-center gap-2 truncate sm:col-span-3">
                  <FolderGit2
                    className="hidden h-4 w-4 shrink-0 text-neutral-500 sm:block"
                    aria-hidden="true"
                  />
                  <span className="truncate">{session.projectName}</span>
                </div>

                <div className="hidden items-center gap-1.5 truncate sm:col-span-3 sm:flex">
                  <span className="mono-sm inline-flex items-center gap-1 truncate rounded-md border border-white/5 bg-neutral-950/40 px-2 py-0.5">
                    <GitBranch className="h-3 w-3 shrink-0 text-neutral-500" aria-hidden="true" />
                    <span className="truncate">{session.gitBranch ?? 'main'}</span>
                  </span>
                </div>

                <div className="mono-sm col-span-2 text-neutral-200 sm:col-span-2">
                  {formatDuration(session.durationMs)}
                </div>

                <div className="mono-sm col-span-2 text-right text-green-spring sm:col-span-1">
                  {session.focusScore}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

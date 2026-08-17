'use client';

import { useSessions } from '../hooks';

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m ${seconds % 60}s`;
}

export function SessionsListView() {
  const { data: sessions, isLoading, error } = useSessions();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="h4 text-neutral-100">Sessions</h1>
        <p className="desc mt-1 text-neutral-400">Full history of your work sessions</p>
      </div>

      <div className="rounded-xl bg-neutral-900 p-6">
        <div className="mb-4 grid grid-cols-12 gap-4 border-b border-neutral-800 pb-3 text-xs font-bold text-neutral-500">
          <div className="col-span-3">START TIME</div>
          <div className="col-span-3">PROJECT</div>
          <div className="col-span-3">BRANCH</div>
          <div className="col-span-2">DURATION</div>
          <div className="col-span-1 text-right">FOCUS</div>
        </div>

        {isLoading && (
          <div className="py-12 text-center">
            <p className="desc text-neutral-500 animate-pulse">Loading sessions history...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-6 text-red-coral text-sm">
            Failed to load sessions: {error.message}
          </div>
        )}

        {!isLoading && !error && sessions?.length === 0 && (
          <div className="py-12 text-center">
            <p className="desc text-neutral-600">No sessions recorded yet</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {sessions?.map((session) => (
            <div
              key={session.id}
              className="grid grid-cols-12 gap-4 text-sm text-neutral-300 py-2 border-b border-neutral-800/40 last:border-0 hover:bg-neutral-800/20 px-2 rounded-lg transition-colors"
            >
              <div className="col-span-3 text-neutral-400">
                {new Date(session.startedAt).toLocaleString()}
              </div>
              <div className="col-span-3 font-semibold text-neutral-100 truncate">
                {session.projectName}
              </div>
              <div className="col-span-3 text-neutral-400 truncate">
                <span className="font-mono text-xs bg-neutral-800 px-2 py-1 rounded">
                  {session.gitBranch ?? 'no-branch'}
                </span>
              </div>
              <div className="col-span-2 text-neutral-100">
                {formatDuration(session.durationMs)}
              </div>
              <div className="col-span-1 text-right font-bold text-green-spring">
                {session.focusScore}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

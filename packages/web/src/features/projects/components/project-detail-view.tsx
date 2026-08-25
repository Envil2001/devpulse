'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { FolderGit2, Search, Clock, Zap, Layers, ArrowUpRight } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/lib/cn';
import { useProjects, useProject } from '../hooks';

export function ProjectListView() {
  const { data: projects = [], isLoading, error } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return projects;

    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.remote && p.remote.toLowerCase().includes(query)),
    );
  }, [projects, searchQuery]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="title-1">Projects</h2>
        <p className="body-muted mt-1">
          All repositories tracked by your workspace and VS Code extension.
        </p>
      </div>

      <div
        className={cn(
          'rounded-2xl border border-white/5 bg-neutral-900/50 p-6 backdrop-blur-sm',
          'transition-colors hover:border-white/10',
        )}
      >
        <div className="mb-6 flex flex-col items-center justify-between gap-3 border-b border-white/5 pb-4 sm:flex-row">
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
              aria-hidden="true"
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects by name..."
              className="pl-9"
            />
          </div>
          <div className="caption flex items-center gap-2 self-end sm:self-auto">
            <span>Total projects:</span>
            <span className="mono-sm text-neutral-100">{filteredProjects.length}</span>
          </div>
        </div>

        <div>
          {isLoading && (
            <div className="flex h-48 items-center justify-center">
              <span className="body-muted animate-pulse">Loading repositories…</span>
            </div>
          )}

          {error && (
            <div className="flex h-32 items-center justify-center rounded-xl border border-red-coral/20 bg-red-coral/10 p-4">
              <p className="body-base text-red-coral">
                Failed to load projects: {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          )}

          {!isLoading && !error && projects.length === 0 && (
            <div className="flex flex-col items-center rounded-xl border border-white/5 bg-neutral-900/30 p-8 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-neutral-900">
                <FolderGit2 className="h-6 w-6 text-neutral-300" aria-hidden="true" />
              </div>
              <p className="body-muted max-w-md">
                No projects recorded yet. Make sure your VS Code extension is active and tracking
                your workspace.
              </p>
            </div>
          )}

          {!isLoading && !error && projects.length > 0 && filteredProjects.length === 0 && (
            <div className="py-12 text-center">
              <p className="body-muted">No projects matching &ldquo;{searchQuery}&rdquo;</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="mt-2 text-neutral-400 hover:text-neutral-100"
              >
                Clear search query
              </Button>
            </div>
          )}

          {!isLoading && !error && filteredProjects.length > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className={cn(
                    'group relative flex flex-col justify-between rounded-xl border border-white/5',
                    'bg-neutral-900/30 p-5 transition-all duration-200',
                    'hover:border-white/15 hover:bg-neutral-900/80 hover:shadow-lg hover:shadow-black/40',
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-neutral-900 transition-colors group-hover:border-white/20">
                          <FolderGit2
                            className="h-4.5 w-4.5 text-neutral-300 transition-colors group-hover:text-neutral-100"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="body-base truncate font-semibold transition-colors group-hover:text-white">
                            {project.name}
                          </h3>
                          <p className="caption mt-0.5 truncate font-mono text-neutral-500">
                            {project.remote ?? 'Local repository'}
                          </p>
                        </div>
                      </div>

                      <ArrowUpRight
                        className="h-4 w-4 shrink-0 -translate-y-1 translate-x-1 text-neutral-600 opacity-0 transition-all group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-neutral-300 group-hover:opacity-100"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2 rounded-lg border border-white/5 bg-neutral-950/40 p-2.5">
                    <div className="flex flex-col">
                      <span className="caption flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Time
                      </span>
                      <span className="mono-sm mt-0.5 text-neutral-200">{project.activeTime}</span>
                    </div>

                    <div className="flex flex-col">
                      <span className="caption flex items-center gap-1">
                        <Zap className="h-3.5 w-3.5" aria-hidden="true" /> Focus
                      </span>
                      <span className="mono-sm mt-0.5 font-semibold text-green-spring">
                        {project.focusScore}%
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="caption flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5" aria-hidden="true" /> Sessions
                      </span>
                      <span className="mono-sm mt-0.5 text-neutral-200">{project.sessions}</span>
                    </div>
                  </div>

                  <div className="caption mt-3 flex items-center justify-between">
                    <span>Last active</span>
                    <span className="font-medium text-neutral-400">
                      {project.lastActive
                        ? formatDistanceToNow(new Date(project.lastActive), { addSuffix: true })
                        : 'Never'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProjectDetailView({ projectId }: { projectId: string }) {
  const { data: project, isLoading, error } = useProject(projectId);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="body-muted animate-pulse">Loading project details…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-red-coral/20 bg-red-coral/10 p-4">
        <p className="body-base text-red-coral">
          Failed to load project: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="body-muted">Project not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="title-1">{project.name}</h2>
        <p className="body-muted mt-1">{project.remote ?? 'Local repository'}</p>
      </div>

      <div
        className={cn(
          'rounded-2xl border border-white/5 bg-neutral-900/50 p-6 backdrop-blur-sm',
          'transition-colors hover:border-white/10',
        )}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <span className="caption flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Active Time
            </span>
            <span className="metric text-neutral-100">{project.activeTime}</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="caption flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" aria-hidden="true" /> Focus Score
            </span>
            <span className="metric text-green-spring">{project.focusScore}%</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="caption flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" aria-hidden="true" /> Sessions
            </span>
            <span className="metric text-neutral-100">{project.sessions}</span>
          </div>
        </div>

        <div className="caption mt-6 flex items-center justify-between border-t border-white/5 pt-4">
          <span>Last active</span>
          <span className="font-medium text-neutral-400">
            {project.lastActive
              ? formatDistanceToNow(new Date(project.lastActive), { addSuffix: true })
              : 'Never'}
          </span>
        </div>
      </div>
    </div>
  );
}

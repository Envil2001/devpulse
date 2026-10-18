'use client';

import Link from 'next/link';
import { Clock, Zap, Layers, FolderGit2, ArrowUpRight } from 'lucide-react';

import { cn } from '@/shared/lib/cn';
import { formatDateTimeLabel } from '@/shared/lib/date';
import { ProjectSummary } from '@/shared/types';

interface ProjectCardProps {
  project: ProjectSummary;
  timezone: string;
}

export function ProjectCard({ project, timezone }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.id}`}
      aria-label={`View details for project ${project.name}`}
      className={cn(
        'group relative flex flex-col justify-between rounded-xl border border-border bg-surface p-5',
        'outline-none transition-colors duration-200',
        'hover:border-gray-alpha-300 hover:bg-gray-alpha-50',
        'focus-visible:ring-2 focus-visible:ring-white/15',
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-gray-alpha-50">
              <FolderGit2
                className="h-5 w-5 text-subtle transition-colors group-hover:text-secondary"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-medium text-foreground">{project.name}</h3>
              <p className="mt-0.5 truncate font-mono text-xs text-subtle">
                {project.remote ?? 'Local repository'}
              </p>
            </div>
          </div>

          <ArrowUpRight
            className={cn(
              'h-4 w-4 shrink-0 -translate-y-1 translate-x-1 text-subtle opacity-0 transition-all duration-200',
              'group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-100',
            )}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 rounded-lg border border-border bg-gray-alpha-50 p-3">
        <div className="flex flex-col">
          <span className="flex items-center gap-1 text-xs text-subtle">
            <Clock className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
            Time
          </span>
          <span className="mt-1 font-mono text-xs font-medium tabular-nums text-foreground">
            {project.activeTime}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="flex items-center gap-1 text-xs text-subtle">
            <Zap className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
            Focus
          </span>
          <span className="mt-1 font-mono text-xs font-medium tabular-nums text-brand">
            {project.focusScore}%
          </span>
        </div>

        <div className="flex flex-col">
          <span className="flex items-center gap-1 text-xs text-subtle">
            <Layers className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
            Sessions
          </span>
          <span className="mt-1 font-mono text-xs font-medium tabular-nums text-foreground">
            {project.sessions}
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-subtle">
        <span>Last active</span>
        <span className="font-medium text-secondary" suppressHydrationWarning>
          {project.lastActive ? formatDateTimeLabel(project.lastActive, timezone) : 'Never'}
        </span>
      </div>
    </Link>
  );
}

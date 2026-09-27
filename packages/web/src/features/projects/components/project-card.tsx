'use client';

import Link from 'next/link';
import { Clock, Zap, Layers, FolderGit2, ArrowUpRight } from 'lucide-react';

import { cn } from '@/shared/lib/cn';
import { formatDateTimeLabel } from '@/shared/lib/date';
import type { ProjectSummary } from '../api';

interface ProjectCardProps {
  project: ProjectSummary;
  timezone: string;
}

export function ProjectCard({ project, timezone }: ProjectCardProps) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        'group relative flex flex-col justify-between rounded-xl border border-white/5',
        'bg-neutral-900/30 p-5 transition-all duration-200',
        'hover:border-white/15 hover:bg-neutral-900/80 hover:shadow-lg hover:shadow-black/40 outline-none focus-visible:ring-2 focus-visible:ring-white/20',
      )}
      aria-label={`View details for project ${project.name}`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-neutral-900 transition-colors group-hover:border-white/20">
              <FolderGit2
                className="h-5 w-5 text-neutral-400 transition-colors group-hover:text-neutral-200"
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

      <div className="mt-5 grid grid-cols-3 gap-2 rounded-lg border border-white/5 bg-neutral-950/40 p-3">
        <div className="flex flex-col">
          <span className="caption flex items-center gap-1 text-neutral-500">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Time
          </span>
          <span className="mono-sm mt-1 text-neutral-200">{project.activeTime}</span>
        </div>

        <div className="flex flex-col">
          <span className="caption flex items-center gap-1 text-neutral-500">
            <Zap className="h-3.5 w-3.5" aria-hidden="true" /> Focus
          </span>
          <span className="mono-sm mt-1 font-semibold text-green-spring">
            {project.focusScore}%
          </span>
        </div>

        <div className="flex flex-col">
          <span className="caption flex items-center gap-1 text-neutral-500">
            <Layers className="h-3.5 w-3.5" aria-hidden="true" /> Sessions
          </span>
          <span className="mono-sm mt-1 text-neutral-200">{project.sessions}</span>
        </div>
      </div>

      <div className="caption mt-4 flex items-center justify-between">
        <span className="text-neutral-500">Last active</span>
        <span className="font-medium text-neutral-400" suppressHydrationWarning>
          {project.lastActive ? formatDateTimeLabel(project.lastActive, timezone) : 'Never'}
        </span>
      </div>
    </Link>
  );
}

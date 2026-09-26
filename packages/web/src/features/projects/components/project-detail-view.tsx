'use client';

import { formatDistanceToNow } from 'date-fns';
import { Clock, Zap, Layers } from 'lucide-react';

import { useProject } from '../hooks';
import {
  Page,
  PageHeader,
  PageHeaderHeading,
  PageTitle,
  PageDescription,
} from '@/shared/components/layout/page';
import { Panel } from '@/shared/components/layout/panel';

interface ProjectDetailViewProps {
  projectId: string;
}

export function ProjectDetailView({ projectId }: ProjectDetailViewProps) {
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
    <Page>
      <PageHeader>
        <div>
          <PageHeaderHeading>
            <PageTitle>{project.name}</PageTitle>
          </PageHeaderHeading>
          <PageDescription>{project.remote ?? 'Local repository'}</PageDescription>
        </div>
      </PageHeader>

      <Panel>
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
          <span className="font-medium text-neutral-400" suppressHydrationWarning>
            {project.lastActive
              ? formatDistanceToNow(new Date(project.lastActive), { addSuffix: true })
              : 'Never'}
          </span>
        </div>
      </Panel>
    </Page>
  );
}

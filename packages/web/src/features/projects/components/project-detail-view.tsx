'use client';

import { formatDistanceToNow } from 'date-fns';
import { Clock, Zap, Layers, AlertCircle } from 'lucide-react';

import { useProject } from '../hooks';
import {
  Page,
  PageHeader,
  PageHeaderHeading,
  PageTitle,
  PageDescription,
} from '@/shared/components/layout/page';
import { Panel, PanelContent } from '@/shared/components/layout/panel';

interface ProjectDetailViewProps {
  projectId: string;
}

export function ProjectDetailView({ projectId }: ProjectDetailViewProps) {
  const { data: project, isLoading, error } = useProject(projectId);

  if (isLoading) {
    return (
      <Page>
        <PageHeader>
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded-md bg-neutral-800" />
            <div className="h-4 w-64 animate-pulse rounded-md bg-neutral-800" />
          </div>
        </PageHeader>
        <Panel>
          <div className="flex h-40 items-center justify-center">
            <span className="body-muted animate-pulse">Loading project details…</span>
          </div>
        </Panel>
      </Page>
    );
  }

  if (error || !project) {
    return (
      <Page>
        <PageHeader>
          <PageHeaderHeading>
            <PageTitle>Project Error</PageTitle>
          </PageHeaderHeading>
        </PageHeader>
        <Panel>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="mb-4 h-8 w-8 text-red-coral" />
            <p className="body-base font-medium text-red-coral">
              {error instanceof Error ? error.message : 'Project not found'}
            </p>
            <p className="body-muted mt-2">
              The project might have been deleted or you don&apos;t have access to it.
            </p>
          </div>
        </Panel>
      </Page>
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
        <PanelContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-neutral-950/40 p-5">
              <span className="caption flex items-center gap-1.5 text-neutral-500">
                <Clock className="h-4 w-4" aria-hidden="true" /> Active Time
              </span>
              <span className="metric text-neutral-100">{project.activeTime}</span>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-neutral-950/40 p-5">
              <span className="caption flex items-center gap-1.5 text-neutral-500">
                <Zap className="h-4 w-4" aria-hidden="true" /> Focus Score
              </span>
              <span className="metric text-green-spring">{project.focusScore}%</span>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-white/5 bg-neutral-950/40 p-5">
              <span className="caption flex items-center gap-1.5 text-neutral-500">
                <Layers className="h-4 w-4" aria-hidden="true" /> Sessions
              </span>
              <span className="metric text-neutral-100">{project.sessions}</span>
            </div>
          </div>

          <div className="caption mt-8 flex items-center justify-between border-t border-white/5 pt-5">
            <span className="text-neutral-500">Last active</span>
            <span className="font-medium text-neutral-400" suppressHydrationWarning>
              {project.lastActive
                ? formatDistanceToNow(new Date(project.lastActive), { addSuffix: true })
                : 'Never'}
            </span>
          </div>
        </PanelContent>
      </Panel>
    </Page>
  );
}

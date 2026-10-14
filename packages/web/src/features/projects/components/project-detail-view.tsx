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
            <div className="h-8 w-48 animate-pulse rounded-md bg-gray-alpha-100" />
            <div className="h-4 w-64 animate-pulse rounded-md bg-gray-alpha-100" />
          </div>
        </PageHeader>
        <Panel>
          <div className="flex h-40 items-center justify-center">
            <span className="animate-pulse text-sm text-secondary">Loading project details…</span>
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
            <AlertCircle
              className="mb-4 h-8 w-8 text-red-coral"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-red-coral">
              {error instanceof Error ? error.message : 'Project not found'}
            </p>
            <p className="mt-2 text-sm text-secondary">
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
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5">
              <span className="flex items-center gap-1.5 text-xs text-subtle">
                <Clock className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                Active Time
              </span>
              <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                {project.activeTime}
              </span>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5">
              <span className="flex items-center gap-1.5 text-xs text-subtle">
                <Zap className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                Focus Score
              </span>
              <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums text-brand">
                {project.focusScore}%
              </span>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5">
              <span className="flex items-center gap-1.5 text-xs text-subtle">
                <Layers className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
                Sessions
              </span>
              <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                {project.sessions}
              </span>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-border pt-5 text-xs text-subtle">
            <span>Last active</span>
            <span className="font-medium text-secondary" suppressHydrationWarning>
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

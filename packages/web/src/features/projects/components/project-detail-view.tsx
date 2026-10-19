'use client';

import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Clock, GitBranch, GitCommit, Layers, Terminal, Zap } from 'lucide-react';

import { formatDuration } from '@devpulse/lib';

import { useRequireAuth } from '@/features/auth/context';
import {
  Page,
  PageDescription,
  PageHeader,
  PageHeaderHeading,
  PageTitle,
} from '@/shared/components/layout/page';
import { Panel, PanelContent, PanelHeader, PanelTitle } from '@/shared/components/layout/panel';
import { formatDateTimeLabel } from '@/shared/lib/date';

import { useProject } from '../hooks';

interface ProjectDetailViewProps {
  projectId: string;
}

export function ProjectDetailView({ projectId }: ProjectDetailViewProps) {
  const { data: project, isLoading, error } = useProject(projectId);
  const { user } = useRequireAuth();

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-secondary">Loading project details…</div>;
  }

  if (error || !project) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-coral" strokeWidth={1.5} />
        <p className="text-sm text-red-coral">Project not found</p>
        <p className="mt-1 text-xs text-secondary">
          {error instanceof Error ? error.message : 'The project may have been deleted.'}
        </p>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Panel className="flex flex-col justify-between p-5">
          <span className="flex items-center gap-1.5 text-xs text-subtle">
            <Clock className="h-4 w-4" strokeWidth={1.5} /> Active Time
          </span>
          <span className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {project.activeTime}
          </span>
        </Panel>
        <Panel className="flex flex-col justify-between p-5">
          <span className="flex items-center gap-1.5 text-xs text-subtle">
            <Zap className="h-4 w-4" strokeWidth={1.5} /> Focus Score
          </span>
          <span className="mt-2 font-mono text-2xl font-semibold tabular-nums text-brand">
            {project.focusScore}%
          </span>
        </Panel>
        <Panel className="flex flex-col justify-between p-5">
          <span className="flex items-center gap-1.5 text-xs text-subtle">
            <Layers className="h-4 w-4" strokeWidth={1.5} /> Sessions
          </span>
          <span className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {project.sessions}
          </span>
        </Panel>
        <Panel className="flex flex-col justify-between p-5">
          <span className="flex items-center gap-1.5 text-xs text-subtle">
            <GitCommit className="h-4 w-4" strokeWidth={1.5} /> Commits
          </span>
          <span className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {project.totalCommits}
          </span>
        </Panel>
        <Panel className="flex flex-col justify-between p-5">
          <span className="flex items-center gap-1.5 text-xs text-subtle">
            <Terminal className="h-4 w-4" strokeWidth={1.5} /> Commands
          </span>
          <span className="mt-2 font-mono text-2xl font-semibold tabular-nums text-foreground">
            {project.totalCommands}
          </span>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader>
            <PanelTitle>Languages</PanelTitle>
          </PanelHeader>
          <PanelContent className="flex flex-col gap-3">
            {(project.languages ?? []).length === 0 && (
              <span className="py-4 text-center text-sm text-secondary">No language data yet</span>
            )}
            {(project.languages ?? []).map((lang) => (
              <div key={lang.name} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize text-foreground">{lang.name}</span>
                  <span className="font-mono text-xs text-secondary">
                    {formatDuration(lang.seconds)} · {lang.percentage}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-alpha-100">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${lang.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </PanelContent>
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle>Branches</PanelTitle>
          </PanelHeader>
          <PanelContent className="flex flex-col">
            {(project.branches ?? []).length === 0 && (
              <span className="py-4 text-center text-sm text-secondary">No branch data yet</span>
            )}
            {(project.branches ?? []).map((branch, i) => (
              <div
                key={branch.name}
                className={`flex items-center justify-between py-3 text-sm ${
                  i !== project.branches.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-subtle" strokeWidth={1.5} />
                  <span className="truncate font-mono text-foreground">{branch.name}</span>
                </div>
                <span className="font-mono text-xs text-secondary">
                  {formatDuration(branch.seconds)}
                </span>
              </div>
            ))}
          </PanelContent>
        </Panel>
      </div>

      <Panel>
        <PanelHeader>
          <PanelTitle>Recent Sessions</PanelTitle>
        </PanelHeader>
        <PanelContent className="flex flex-col">
          {(project.recentSessions ?? []).length === 0 && (
            <span className="py-4 text-center text-sm text-secondary">No sessions yet</span>
          )}
          {(project.recentSessions ?? []).map((session, i) => (
            <div
              key={session.id}
              className={`grid grid-cols-12 items-center gap-4 py-3 text-sm ${
                i !== project.recentSessions.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <div className="col-span-4 font-mono text-xs text-secondary">
                {formatDateTimeLabel(session.startedAt, user.timezone)}
              </div>
              <div className="col-span-4 flex items-center gap-2">
                <GitBranch className="h-3.5 w-3.5 text-subtle" strokeWidth={1.5} />
                <span className="truncate font-mono text-xs text-foreground">
                  {session.gitBranch ?? 'main'}
                </span>
              </div>
              <div className="col-span-2 font-mono text-xs text-foreground">
                {formatDuration(session.durationSeconds)}
              </div>
              <div className="col-span-2 text-right text-xs capitalize text-secondary">
                {session.primaryLanguage ?? '—'}
              </div>
            </div>
          ))}
        </PanelContent>
      </Panel>

      <div className="mt-2 text-right text-xs text-subtle">
        Last active:{' '}
        {project.lastActive
          ? formatDistanceToNow(new Date(project.lastActive), { addSuffix: true })
          : 'Never'}
      </div>
    </Page>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { FolderGit2, Search } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useProjects } from '../hooks';
import { useRequireAuth } from '@/features/auth/context';
import {
  PageHeader,
  PageHeaderHeading,
  PageTitle,
  PageDescription,
  Page,
} from '@/shared/components/layout/page';
import { Panel, PanelHeader, PanelContent } from '@/shared/components/layout/panel';
import { ProjectCard } from './project-card';

export function ProjectListView() {
  const { data: projects = [], isLoading, error } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useRequireAuth();

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
    <Page>
      <PageHeader>
        <div>
          <PageHeaderHeading>
            <PageTitle>Projects</PageTitle>
          </PageHeaderHeading>
          <PageDescription>
            All repositories tracked by your workspace and VS Code extension.
          </PageDescription>
        </div>
      </PageHeader>

      <Panel>
        <PanelHeader>
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
            <span className="mono-sm text-neutral-100">
              {isLoading ? '—' : filteredProjects.length}
            </span>
          </div>
        </PanelHeader>

        <PanelContent>
          {isLoading && (
            <div className="flex h-48 items-center justify-center">
              <span className="body-muted animate-pulse">Loading repositories…</span>
            </div>
          )}

          {error && (
            <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-red-coral/20 bg-red-coral/10 p-4 text-center">
              <p className="body-base font-medium text-red-coral">Failed to load projects</p>
              <p className="caption mt-1 text-red-coral/80">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          )}

          {!isLoading && !error && projects.length === 0 && (
            <div className="flex flex-col items-center rounded-xl border border-white/5 bg-neutral-900/30 p-12 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-neutral-900">
                <FolderGit2 className="h-6 w-6 text-neutral-400" aria-hidden="true" />
              </div>
              <h3 className="body-base font-medium">No projects found</h3>
              <p className="body-muted mt-1 max-w-md">
                Make sure your VS Code extension is active and tracking your workspace.
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
                <ProjectCard key={project.id} project={project} timezone={user.timezone} />
              ))}
            </div>
          )}
        </PanelContent>
      </Panel>
    </Page>
  );
}

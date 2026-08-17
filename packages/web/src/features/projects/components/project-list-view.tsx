'use client';

import Link from 'next/link';
import { useProjects } from '../hooks';

export function ProjectListView() {
  const { data: projects, isLoading, error } = useProjects();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="h4 text-neutral-100">Projects</h1>
        <p className="desc mt-1 text-neutral-400">All repositories you worked on</p>
      </div>

      {isLoading && (
        <div className="py-12 text-center">
          <p className="desc text-neutral-500 animate-pulse">Loading projects...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-coral/10 border border-red-coral text-red-coral p-4 rounded-xl text-sm">
          Failed to load projects: {error.message}
        </div>
      )}

      {!isLoading && !error && projects?.length === 0 && (
        <div className="py-12 text-center rounded-xl border border-dashed border-neutral-800">
          <p className="desc text-neutral-500">No projects recorded yet.</p>
          <p className="desc mt-1 text-neutral-600 text-xs">
            Make sure your VS Code extension is active and configured.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {projects?.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="flex flex-col gap-4 rounded-xl bg-neutral-900 p-5 transition-colors hover:bg-neutral-800/80"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="body2 text-neutral-100">{project.name}</h3>
                <p className="desc mt-1 text-neutral-500 truncate max-w-55">
                  {project.remote ?? 'Local repository'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="desc text-neutral-500">Active</p>
                <p className="body1 text-neutral-100">{project.activeTime}</p>
              </div>
              <div>
                <p className="desc text-neutral-500">Focus</p>
                <p className="body1 text-green-spring">{project.focusScore}%</p>
              </div>
              <div>
                <p className="desc text-neutral-500">Sessions</p>
                <p className="body1 text-neutral-100">{project.sessions}</p>
              </div>
            </div>

            <p className="desc text-neutral-600">
              Last active:{' '}
              {project.lastActive ? new Date(project.lastActive).toLocaleString() : 'N/A'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { type JSX } from 'react/jsx-runtime';

import { ProjectListView } from '@/features/projects/components/project-list-view';
import { projectsKeys } from '@/features/projects/hooks';
import { getProjectsServer } from '@/features/projects/server';
import { getQueryClient } from '@/shared/api/get-query-client';

export default async function ProjectsPage(): Promise<JSX.Element> {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: projectsKeys.list(),
    queryFn: getProjectsServer,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectListView />
    </HydrationBoundary>
  );
}

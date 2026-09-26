import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/api/get-query-client';
import { projectsKeys } from '@/features/projects/hooks';
import { getProjectsServer } from '@/features/projects/server';
import { ProjectListView } from '@/features/projects/components/project-list-view';

export default async function ProjectsPage() {
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

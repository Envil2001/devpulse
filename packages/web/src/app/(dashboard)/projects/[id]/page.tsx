import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/api/get-query-client';
import { projectsKeys } from '@/features/projects/hooks';
import { getProjectByIdServer } from '@/features/projects/server';
import { ProjectDetailView } from '@/features/projects/components/project-detail-view';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: projectsKeys.detail(id),
    queryFn: () => getProjectByIdServer(id),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectDetailView projectId={id} />
    </HydrationBoundary>
  );
}

import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { type JSX } from 'react/jsx-runtime';

import { ProjectDetailView } from '@/features/projects/components/project-detail-view';
import { projectsKeys } from '@/features/projects/hooks';
import { getProjectByIdServer } from '@/features/projects/server';
import { getQueryClient } from '@/shared/api/get-query-client';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<JSX.Element> {
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

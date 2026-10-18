import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/api/get-query-client';
import { sessionsKeys } from '@/features/sessions/hooks';
import { sessionsService } from '@/shared/api/services';
import { SessionDetailView } from '@/features/sessions/components/session-detail-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: sessionsKeys.detail(id),
    queryFn: () => sessionsService.getById(id),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SessionDetailView id={id} />
    </HydrationBoundary>
  );
}

import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/api/get-query-client';
import { sessionsKeys } from '@/features/sessions/hooks';
import { getSessionsServer } from '@/features/sessions/server';
import { SessionsListView } from '@/features/sessions/components/sessions-list-view';

export default async function SessionsPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: sessionsKeys.list(),
    queryFn: getSessionsServer,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SessionsListView />
    </HydrationBoundary>
  );
}

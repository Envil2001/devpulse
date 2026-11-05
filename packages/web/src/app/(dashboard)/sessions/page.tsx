import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { type JSX } from 'react/jsx-runtime';

import { SessionsListView } from '@/features/sessions/components/sessions-list-view';
import { sessionsKeys } from '@/features/sessions/hooks';
import { getSessionsServer } from '@/features/sessions/server';
import { getQueryClient } from '@/shared/api/get-query-client';

export default async function SessionsPage(): Promise<JSX.Element> {
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

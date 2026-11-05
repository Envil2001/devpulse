import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { type JSX } from 'react/jsx-runtime';

import { SessionDetailView } from '@/features/sessions/components/session-detail-view';
import { sessionsKeys } from '@/features/sessions/hooks';
import { getSessionByIdServer } from '@/features/sessions/server';
import { getQueryClient } from '@/shared/api/get-query-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionDetailPage({ params }: PageProps): Promise<JSX.Element> {
  const { id } = await params;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: sessionsKeys.detail(id),
    queryFn: () => getSessionByIdServer(id),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SessionDetailView id={id} />
    </HydrationBoundary>
  );
}

import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { type JSX } from 'react/jsx-runtime';

import { apiKeysKeys } from '@/features/api-keys/hooks';
import { getApiKeysServer } from '@/features/api-keys/server';
import { SettingsView } from '@/features/users/components/settings-view';
import { getQueryClient } from '@/shared/api/get-query-client';

export default async function SettingsPage(): Promise<JSX.Element> {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: apiKeysKeys.list(),
    queryFn: getApiKeysServer,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SettingsView />
    </HydrationBoundary>
  );
}

import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { type JSX } from 'react/jsx-runtime';

import { EarningsView } from '@/features/analytics/components/earnings-view';
import { analyticsKeys, periodToDateRange } from '@/features/analytics/hooks';
import { getDashboardStatsServer } from '@/features/analytics/server';
import { getQueryClient } from '@/shared/api/get-query-client';

export default async function EarningsPage(): Promise<JSX.Element> {
  const queryClient = getQueryClient();

  const range30d = periodToDateRange('30d');
  const range7d = periodToDateRange('7d');

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: analyticsKeys.dashboard(range30d),
      queryFn: () => getDashboardStatsServer(range30d),
    }),
    queryClient.prefetchQuery({
      queryKey: analyticsKeys.dashboard(range7d),
      queryFn: () => getDashboardStatsServer(range7d),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EarningsView range30d={range30d} range7d={range7d} />
    </HydrationBoundary>
  );
}

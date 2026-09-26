import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/api/get-query-client';
import { periodToDateRange, analyticsKeys } from '@/features/analytics/hooks';
import { getDashboardStatsServer } from '@/features/analytics/server';
import { EarningsView } from '@/features/analytics/components/earnings-view';

export default async function EarningsPage() {
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
      <EarningsView />
    </HydrationBoundary>
  );
}

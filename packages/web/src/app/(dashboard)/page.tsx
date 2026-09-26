import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/api/get-query-client';
import { periodToDateRange, analyticsKeys } from '@/features/analytics/hooks';
import {
  getDashboardStatsServer,
  getTimeseriesServer,
  getBranchesServer,
  getLanguagesServer,
  getLiveStatusServer,
} from '@/features/analytics/server';
import { DashboardView } from '@/features/analytics/components/dashboard-view';

export default async function DashboardPage() {
  const queryClient = getQueryClient();

  const defaultRange = periodToDateRange('7d');

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: analyticsKeys.dashboard(defaultRange),
      queryFn: () => getDashboardStatsServer(defaultRange),
    }),
    queryClient.prefetchQuery({
      queryKey: analyticsKeys.timeseries(defaultRange),
      queryFn: () => getTimeseriesServer(defaultRange),
    }),
    queryClient.prefetchQuery({
      queryKey: analyticsKeys.branches(defaultRange),
      queryFn: () => getBranchesServer(defaultRange),
    }),
    queryClient.prefetchQuery({
      queryKey: analyticsKeys.languages(),
      queryFn: getLanguagesServer,
    }),
    queryClient.prefetchQuery({
      queryKey: analyticsKeys.status(),
      queryFn: getLiveStatusServer,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardView />
    </HydrationBoundary>
  );
}

import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/shared/api/get-query-client';
import {
  periodToDateRange,
  analyticsKeys,
  getHeatmapRange,
  previousPeriod,
} from '@/features/analytics/hooks';
import {
  getDashboardStatsServer,
  getTimeseriesServer,
  getBranchesServer,
  getLanguagesServer,
  getLiveStatusServer,
  getAiRoiServer,
  getCommandsServer,
  getPipelineHealthServer,
} from '@/features/analytics/server';
import { DashboardView } from '@/features/analytics/components/dashboard-view';
import { getProjectsServer } from '@/features/projects/server';
import { projectsKeys } from '@/features/projects/hooks';
import { getRecentSessionsServer } from '@/features/sessions/server';
import { RECENT_SESSIONS_LIMIT, sessionsKeys } from '@/features/sessions/hooks';

export default async function DashboardPage() {
  const queryClient = getQueryClient();

  const defaultRange = periodToDateRange('7d');
  const comparisonRange = previousPeriod(defaultRange);
  const heatmapRange = getHeatmapRange();

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
    queryClient.prefetchQuery({
      queryKey: analyticsKeys.aiRoi(defaultRange),
      queryFn: () => getAiRoiServer(defaultRange),
    }),
    queryClient.prefetchQuery({
      queryKey: analyticsKeys.commands(defaultRange),
      queryFn: () => getCommandsServer(defaultRange),
    }),
    queryClient.prefetchQuery({
      queryKey: analyticsKeys.pipelineHealth(),
      queryFn: getPipelineHealthServer,
    }),
    queryClient.prefetchQuery({
      queryKey: analyticsKeys.dashboard(comparisonRange),
      queryFn: () => getDashboardStatsServer(comparisonRange),
    }),
    queryClient.prefetchQuery({
      queryKey: analyticsKeys.timeseries(heatmapRange),
      queryFn: () => getTimeseriesServer(heatmapRange),
    }),
    queryClient.prefetchQuery({
      queryKey: projectsKeys.list(),
      queryFn: getProjectsServer,
    }),
    queryClient.prefetchQuery({
      queryKey: sessionsKeys.recent(RECENT_SESSIONS_LIMIT),
      queryFn: () => getRecentSessionsServer(RECENT_SESSIONS_LIMIT),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardView initialRange={defaultRange} initialHeatmapRange={heatmapRange} />
    </HydrationBoundary>
  );
}

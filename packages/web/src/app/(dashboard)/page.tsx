import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { type JSX } from 'react/jsx-runtime';

import { DashboardView } from '@/features/analytics/components/dashboard-view';
import {
  analyticsKeys,
  getHeatmapRange,
  periodToDateRange,
  previousPeriod,
} from '@/features/analytics/hooks';
import {
  getAiRoiServer,
  getBranchesServer,
  getCommandsServer,
  getDashboardStatsServer,
  getHotFilesServer,
  getLanguagesServer,
  getLiveStatusServer,
  getPipelineHealthServer,
  getTimeseriesServer,
} from '@/features/analytics/server';
import { projectsKeys } from '@/features/projects/hooks';
import { getProjectsServer } from '@/features/projects/server';
import { RECENT_SESSIONS_LIMIT, sessionsKeys } from '@/features/sessions/hooks';
import { getRecentSessionsServer } from '@/features/sessions/server';
import { getQueryClient } from '@/shared/api/get-query-client';

export default async function DashboardPage(): Promise<JSX.Element> {
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
      queryKey: analyticsKeys.hotFiles(defaultRange),
      queryFn: () => getHotFilesServer(defaultRange),
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

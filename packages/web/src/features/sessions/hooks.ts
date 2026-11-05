import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { sessionsService } from '@/shared/api/services';
import { type WorkSessionDetail, type WorkSessionSummary } from '@/shared/types';

export const sessionsKeys = {
  all: ['sessions'] as const,
  list: () => ['sessions', 'list'] as const,
  recent: (limit: number, projectId?: string) => ['sessions', 'recent', limit, projectId] as const,
  detail: (id: string) => ['sessions', 'detail', id] as const,
};

export const RECENT_SESSIONS_LIMIT = 5;

export function useSessions(): UseQueryResult<NoInfer<Array<WorkSessionSummary>>> {
  return useQuery<Array<WorkSessionSummary>>({
    queryKey: sessionsKeys.list(),
    queryFn: () => sessionsService.list(),
  });
}

export function useRecentSessions(
  limit: number,
  projectId?: string,
): UseQueryResult<NoInfer<Array<WorkSessionSummary>>> {
  return useQuery<Array<WorkSessionSummary>>({
    queryKey: sessionsKeys.recent(limit, projectId),
    queryFn: () => sessionsService.list(limit, projectId),
    refetchInterval: 60_000,
  });
}

export function useSessionDetail(id: string): UseQueryResult<WorkSessionDetail> {
  return useQuery<WorkSessionDetail>({
    queryKey: sessionsKeys.detail(id),
    queryFn: () => sessionsService.getById(id),
    enabled: id.length > 0,
  });
}

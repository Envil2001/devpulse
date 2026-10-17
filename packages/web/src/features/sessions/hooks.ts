import { useQuery } from '@tanstack/react-query';
import { WorkSessionDetail, WorkSessionSummary, sessionsService } from './api';

export const sessionsKeys = {
  all: ['sessions'] as const,
  list: () => ['sessions', 'list'] as const,
  recent: (limit: number, projectId?: string) => ['sessions', 'recent', limit, projectId] as const,
  detail: (id: string) => ['sessions', 'detail', id] as const,
};

export function useSessions() {
  return useQuery<Array<WorkSessionSummary>>({
    queryKey: sessionsKeys.list(),
    queryFn: () => sessionsService.list(),
  });
}

export function useRecentSessions(limit: number, projectId?: string) {
  return useQuery<Array<WorkSessionSummary>>({
    queryKey: sessionsKeys.recent(limit, projectId),
    queryFn: () => sessionsService.list(limit, projectId),
    refetchInterval: 60_000,
  });
}

export function useSessionDetail(id: string) {
  return useQuery<WorkSessionDetail>({
    queryKey: sessionsKeys.detail(id),
    queryFn: () => sessionsService.getById(id),
    enabled: id.length > 0,
  });
}

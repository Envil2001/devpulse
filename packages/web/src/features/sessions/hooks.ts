import { useQuery } from '@tanstack/react-query';
import { WorkSessionSummary, sessionsService } from './api';

export const sessionsKeys = {
  all: ['sessions'] as const,
  list: () => ['sessions', 'list'] as const,
  recent: (limit: number) => ['sessions', 'recent', limit] as const,
};

export function useSessions() {
  return useQuery<Array<WorkSessionSummary>>({
    queryKey: sessionsKeys.list(),
    queryFn: () => sessionsService.list(),
  });
}

export function useRecentSessions(limit: number) {
  return useQuery<Array<WorkSessionSummary>>({
    queryKey: sessionsKeys.recent(limit),
    queryFn: () => sessionsService.list(limit),
    refetchInterval: 60_000,
  });
}

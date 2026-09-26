import { useQuery } from '@tanstack/react-query';
import { WorkSessionSummary, sessionsService } from './api';

export const sessionsKeys = {
  all: ['sessions'] as const,
  list: () => ['sessions'] as const,
};

export function useSessions() {
  return useQuery<Array<WorkSessionSummary>>({
    queryKey: sessionsKeys.list(),
    queryFn: () => sessionsService.list(),
  });
}

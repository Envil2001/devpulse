import { useQuery } from '@tanstack/react-query';
import { WorkSessionSummary, sessionsService } from './api';

export function useSessions() {
  return useQuery<Array<WorkSessionSummary>>({
    queryKey: ['sessions'],
    queryFn: () => sessionsService.list(),
  });
}

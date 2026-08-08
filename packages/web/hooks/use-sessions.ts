import { useQuery } from '@tanstack/react-query';
import { sessionsService, type WorkSessionSummary } from '@/lib/sessions.service';

export function useSessions() {
  return useQuery<Array<WorkSessionSummary>>({
    queryKey: ['sessions'],
    queryFn: () => sessionsService.list(),
  });
}

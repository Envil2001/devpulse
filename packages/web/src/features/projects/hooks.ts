import { useQuery,type UseQueryResult } from '@tanstack/react-query';

import { projectsService } from '@/shared/api/services';
import { type ProjectSummary } from '@/shared/types';

export const projectsKeys = {
  all: ['projects'] as const,
  list: () => ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
};

export function useProjects(): UseQueryResult<Array<ProjectSummary>, Error> {
  return useQuery<Array<ProjectSummary>>({
    queryKey: projectsKeys.list(),
    queryFn: () => projectsService.list(),
  });
}

export function useProject(id: string): UseQueryResult<ProjectSummary, Error> {
  return useQuery<ProjectSummary>({
    queryKey: projectsKeys.detail(id),
    queryFn: () => projectsService.getById(id),
  });
}

import { projectsService } from '@/shared/api/services';
import { ProjectSummary } from '@/shared/types';
import { useQuery } from '@tanstack/react-query';

export const projectsKeys = {
  all: ['projects'] as const,
  list: () => ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
};

export function useProjects() {
  return useQuery<Array<ProjectSummary>>({
    queryKey: projectsKeys.list(),
    queryFn: () => projectsService.list(),
  });
}

export function useProject(id: string) {
  return useQuery<ProjectSummary>({
    queryKey: projectsKeys.detail(id),
    queryFn: () => projectsService.getById(id),
  });
}

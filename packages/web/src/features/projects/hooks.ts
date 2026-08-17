import { useQuery } from '@tanstack/react-query';
import { ProjectSummary, projectsService } from './api';

export function useProjects() {
  return useQuery<Array<ProjectSummary>>({
    queryKey: ['projects'],
    queryFn: () => projectsService.list(),
  });
}

export function useProject(id: string) {
  return useQuery<ProjectSummary>({
    queryKey: ['projects', id],
    queryFn: () => projectsService.getById(id),
  });
}

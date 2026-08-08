import { useQuery } from '@tanstack/react-query';
import { projectsService, type ProjectSummary } from '@/lib/projects.service';

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

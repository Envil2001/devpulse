import { BaseService } from '@/shared/api/base.service';
import type { ProjectSummary } from '@/shared/types';

export class ProjectsService extends BaseService {
  async list(): Promise<Array<ProjectSummary>> {
    return this.get<Array<ProjectSummary>>('/projects');
  }

  async getById(id: string): Promise<ProjectSummary> {
    return this.get<ProjectSummary>(`/projects/${id}`);
  }
}

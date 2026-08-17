import { BaseService } from '@/shared/api/base.service';

export interface ProjectSummary {
  id: string;
  name: string;
  remote: string | null;
  activeTime: string;
  focusScore: number;
  sessions: number;
  lastActive: string | null;
}

export class ProjectsService extends BaseService {
  async list(): Promise<Array<ProjectSummary>> {
    return this.get<Array<ProjectSummary>>('/projects');
  }

  async getById(id: string): Promise<ProjectSummary> {
    return this.get<ProjectSummary>(`/projects/${id}`);
  }
}

export const projectsService = new ProjectsService();

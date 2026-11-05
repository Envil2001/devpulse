import { serverGet } from '@/shared/api/server-client';
import { type ProjectSummary } from '@/shared/types';

export const getProjectsServer = (): Promise<Array<ProjectSummary>> =>
  serverGet<Array<ProjectSummary>>('/projects');

export const getProjectByIdServer = (id: string): Promise<ProjectSummary> =>
  serverGet<ProjectSummary>(`/projects/${id}`);

import { serverGet } from '@/shared/api/server-client';
import { ProjectSummary } from '@/shared/types';

export const getProjectsServer = () => serverGet<Array<ProjectSummary>>('/projects');

export const getProjectByIdServer = (id: string) => serverGet<ProjectSummary>(`/projects/${id}`);

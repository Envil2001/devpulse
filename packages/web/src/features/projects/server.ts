import { serverGet } from '@/shared/api/server-client';
import type { ProjectSummary } from './api';

export const getProjectsServer = () => serverGet<Array<ProjectSummary>>('/projects');

export const getProjectByIdServer = (id: string) => serverGet<ProjectSummary>(`/projects/${id}`);

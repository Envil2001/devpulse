import { serverGet } from '@/shared/api/server-client';
import { type WorkSessionDetail, type WorkSessionSummary } from '@/shared/types';

export const getSessionsServer = (): Promise<Array<WorkSessionSummary>> =>
  serverGet<Array<WorkSessionSummary>>('/telemetry/sessions');

export const getRecentSessionsServer = (
  limit: number,
  projectId?: string,
): Promise<Array<WorkSessionSummary>> =>
  serverGet<Array<WorkSessionSummary>>('/telemetry/sessions', {
    params: { limit, projectId },
  });

export const getSessionByIdServer = (id: string): Promise<WorkSessionDetail> =>
  serverGet<WorkSessionDetail>(`/telemetry/sessions/${id}`);

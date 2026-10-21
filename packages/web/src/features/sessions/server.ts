import { serverGet } from '@/shared/api/server-client';
import { WorkSessionDetail, WorkSessionSummary } from '@/shared/types';

export const getSessionsServer = () => serverGet<Array<WorkSessionSummary>>('/telemetry/sessions');

export const getSessionByIdServer = (id: string) =>
  serverGet<WorkSessionDetail>(`/telemetry/sessions/${id}`);

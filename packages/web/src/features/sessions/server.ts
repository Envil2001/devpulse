import { serverGet } from '@/shared/api/server-client';
import { WorkSessionSummary } from '@/shared/types';

export const getSessionsServer = () => serverGet<Array<WorkSessionSummary>>('/telemetry/sessions');

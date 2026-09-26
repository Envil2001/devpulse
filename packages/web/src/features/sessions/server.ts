import { serverGet } from '@/shared/api/server-client';
import type { WorkSessionSummary } from './api';

export const getSessionsServer = () => serverGet<Array<WorkSessionSummary>>('/telemetry/sessions');

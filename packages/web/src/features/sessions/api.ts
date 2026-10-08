import { BaseService } from '@/shared/api/base.service';

export interface WorkSessionSummary {
  id: string;
  startedAt: string;
  endedAt: string;
  projectName: string;
  gitBranch: string | null;
  durationMs: number;
  focusScore: number;
  earnedMoney: number;
  primaryLanguage: string | null;
  status: 'active' | 'closed';
}

export class SessionsService extends BaseService {
  async list(limit?: number): Promise<Array<WorkSessionSummary>> {
    return this.get<Array<WorkSessionSummary>>('/telemetry/sessions', {
      params: limit ? { limit } : undefined,
    });
  }
}

export const sessionsService = new SessionsService();

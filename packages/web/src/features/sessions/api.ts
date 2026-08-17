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
}

export class SessionsService extends BaseService {
  async list(): Promise<Array<WorkSessionSummary>> {
    return this.get<Array<WorkSessionSummary>>('/telemetry/sessions');
  }
}

export const sessionsService = new SessionsService();

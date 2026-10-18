import { BaseService } from '@/shared/api/base.service';
import type { WorkSessionDetail, WorkSessionSummary } from '@/shared/types';

export class SessionsService extends BaseService {
  async list(limit?: number, projectId?: string): Promise<Array<WorkSessionSummary>> {
    return this.get<Array<WorkSessionSummary>>('/telemetry/sessions', {
      params: {
        ...(limit ? { limit } : {}),
        ...(projectId ? { projectId } : {}),
      },
    });
  }
  async getById(id: string): Promise<WorkSessionDetail> {
    return this.get<WorkSessionDetail>(`/telemetry/sessions/${id}`);
  }
}

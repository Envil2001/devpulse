import { QueryParams } from '@/shared/api/api-client';
import { BaseService } from '@/shared/api/base.service';

export interface DailyWorklogResponse {
  date: string;
  summary: string;
}

export interface GenerateWorklogParams extends QueryParams {
  startDate: string;
  endDate: string;
}

export class WorklogService extends BaseService {
  async generateSummary(params: GenerateWorklogParams): Promise<DailyWorklogResponse> {
    return this.get<DailyWorklogResponse>('/worklog/generate', { params });
  }
}

export const worklogService = new WorklogService();

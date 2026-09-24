import { BaseService } from '@/shared/api/base.service';

export interface DailyWorklogResponse {
  date: string;
  summary: string;
}

export interface GenerateWorklogParams {
  startDate: string;
  endDate: string;
}

export class WorklogService extends BaseService {
  async generateSummary(params: GenerateWorklogParams): Promise<DailyWorklogResponse> {
    const query = `?startDate=${params.startDate}&endDate=${params.endDate}`;
    return this.get<DailyWorklogResponse>(`/worklog/generate${query}`);
  }
}

export const worklogService = new WorklogService();

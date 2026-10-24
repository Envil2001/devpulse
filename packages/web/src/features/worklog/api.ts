import { QueryParams } from '@/shared/api/api-client';
import { BaseService } from '@/shared/api/base.service';
import type { WorklogFormat, WorklogLanguage, WorklogPlan, WorklogDayResult } from '@/shared/types';

export interface WorklogPlanParams extends QueryParams {
  startDate: string;
  endDate: string;
}

export interface GenerateDayParams {
  date: string;
  format: WorklogFormat;
  language: WorklogLanguage;
  force?: boolean;
}

export class WorklogService extends BaseService {
  /** No LLM requests: lists active days and checks the provider limit. */
  async getPlan(params: WorklogPlanParams): Promise<WorklogPlan> {
    return this.get<WorklogPlan>('/worklog/plan', { params });
  }

  /** One LLM request at most. Served from the cache when the day has not changed. */
  async generateDay(body: GenerateDayParams): Promise<WorklogDayResult> {
    return this.post<WorklogDayResult, GenerateDayParams>('/worklog/day', body);
  }
}

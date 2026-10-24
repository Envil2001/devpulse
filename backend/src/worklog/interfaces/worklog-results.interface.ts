import { type LlmTier } from '../constants/worklog.constants';

export interface WorklogPlanDay {
  date: string;
  activeMinutes: number;
  focusScore: number;
  projects: Array<string>;
}

export interface WorklogPlan {
  startDate: string;
  endDate: string;
  limits: {
    maxRangeDays: number;
    maxActiveDays: number;
    tier: LlmTier;
  };
  exceedsLimit: boolean;
  totals: {
    activeDays: number;
    activeMinutes: number;
    averageFocusScore: number;
  };
  days: Array<WorklogPlanDay>;
}

export interface WorklogDayResult {
  date: string;
  text: string;
  model: string;
  cached: boolean;
}

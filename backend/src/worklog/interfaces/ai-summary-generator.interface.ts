import { type WorklogFormat, type WorklogLanguage } from '../constants/worklog.constants';

import type { DayFacts } from './day-facts.interface';
import type { LlmConfig } from './llm-config.interface';

export interface DaySummaryRequest {
  facts: DayFacts;
  format: WorklogFormat;
  language: WorklogLanguage;
}

export interface GeneratedText {
  text: string;
  model: string;
}

export interface AiSummaryGenerator {
  generate(request: DaySummaryRequest, config: LlmConfig): Promise<GeneratedText>;
}

export const AI_SUMMARY_GENERATOR = Symbol('AI_SUMMARY_GENERATOR');

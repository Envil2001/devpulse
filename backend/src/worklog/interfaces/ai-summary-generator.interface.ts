export interface SummaryInputData {
  apiKey?: string | null;
  date: string;
  totalTime: string;
  projects: string;
  branches: string;
  languages: string;
  focusScore: number;
}

export interface AiSummaryGenerator {
  generate(input: SummaryInputData): Promise<string>;
}

export const AI_SUMMARY_GENERATOR = Symbol('AI_SUMMARY_GENERATOR');

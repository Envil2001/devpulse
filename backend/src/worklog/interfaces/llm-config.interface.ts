export const LLM_PROVIDER_IDS = ['openrouter', 'openai', 'custom'] as const;
export type LlmProviderId = (typeof LLM_PROVIDER_IDS)[number];

export interface LlmConfig {
  provider: LlmProviderId;
  apiKey: string;
  model: string | null;
  baseUrl: string | null;
}

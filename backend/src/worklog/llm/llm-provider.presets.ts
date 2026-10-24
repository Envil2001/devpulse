import { BadRequestException } from '@nestjs/common';

import { type LlmTier } from '../constants/worklog.constants';
import type { LlmConfig } from '../interfaces/llm-config.interface';

import { assertSafeBaseUrl } from './validate-base-url';

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

const OPENROUTER_FREE_MODELS: ReadonlyArray<string> = [
  'openrouter/free',
  'inclusionai/ling-3.1-flash',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
];

export interface ResolvedLlm {
  baseURL: string | undefined;
  models: ReadonlyArray<string>;
  tier: LlmTier;
  tokenParam: 'max_tokens' | 'max_completion_tokens';
  excludeReasoning: boolean;
}

export async function resolveLlm(config: LlmConfig): Promise<ResolvedLlm> {
  const model = config.model?.trim() ?? null;

  switch (config.provider) {
    case 'openrouter': {
      return {
        baseURL: OPENROUTER_BASE_URL,
        models: model ? [model] : OPENROUTER_FREE_MODELS,
        tier: !model || model.endsWith(':free') ? 'free' : 'paid',
        tokenParam: 'max_tokens',
        excludeReasoning: true,
      };
    }

    case 'openai': {
      if (!model) {
        throw new BadRequestException('Choose a model for OpenAI in Settings.');
      }

      return {
        baseURL: undefined,
        models: [model],
        tier: 'paid',
        tokenParam: 'max_completion_tokens',
        excludeReasoning: false,
      };
    }

    case 'custom': {
      if (!model || !config.baseUrl) {
        throw new BadRequestException('A custom provider needs both a base URL and a model.');
      }

      const baseURL = await assertSafeBaseUrl(
        config.baseUrl,
        process.env.LLM_ALLOW_PRIVATE_BASE_URL === 'true',
      );

      return {
        baseURL,
        models: [model],
        tier: 'paid',
        tokenParam: 'max_tokens',
        excludeReasoning: false,
      };
    }

    default: {
      throw new BadRequestException(`Unknown LLM provider: ${String(config.provider)}`);
    }
  }
}

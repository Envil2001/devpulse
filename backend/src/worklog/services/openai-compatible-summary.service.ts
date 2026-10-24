import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import OpenAI from 'openai';

import type {
  AiSummaryGenerator,
  DaySummaryRequest,
  GeneratedText,
} from '../interfaces/ai-summary-generator.interface';
import type { LlmConfig, LlmProviderId } from '../interfaces/llm-config.interface';
import { type ResolvedLlm, resolveLlm } from '../llm/llm-provider.presets';
import { buildSystemPrompt, buildUserPrompt } from '../prompt/build-prompt';
import { stripReasoning } from '../prompt/strip-reasoning';

/** One day is one short request, so the limits are tighter than for a whole period. */
const PER_MODEL_TIMEOUT_MS = 25_000;
const TOTAL_DEADLINE_MS = 50_000;
const MAX_OUTPUT_TOKENS = 2000;
const TEMPERATURE = 0.4;
const MAX_LOGGED_MESSAGE_LENGTH = 200;

const PROVIDER_LABELS: Record<LlmProviderId, string> = {
  openrouter: 'OpenRouter',
  openai: 'OpenAI',
  custom: 'the custom provider',
};

@Injectable()
export class OpenAiCompatibleSummaryService implements AiSummaryGenerator {
  private readonly logger = new Logger(OpenAiCompatibleSummaryService.name);

  public async generate(request: DaySummaryRequest, config: LlmConfig): Promise<GeneratedText> {
    const llm = await resolveLlm(config);
    const client = new OpenAI({ apiKey: config.apiKey, baseURL: llm.baseURL, maxRetries: 0 });

    const { text, model } = await this.requestCompletion(
      client,
      llm,
      PROVIDER_LABELS[config.provider],
      request,
    );
    const cleaned = stripReasoning(text);

    if (!cleaned) {
      throw new BadGatewayException('AI returned an empty response. Please try again.');
    }

    return { text: cleaned, model };
  }

  private async requestCompletion(
    client: OpenAI,
    llm: ResolvedLlm,
    providerLabel: string,
    request: DaySummaryRequest,
  ): Promise<GeneratedText> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, TOTAL_DEADLINE_MS);

    let rateLimited = false;

    try {
      for (const model of llm.models) {
        if (controller.signal.aborted) break;

        try {
          const result = await this.tryModel(client, llm, model, request, controller.signal);

          if (result !== null) {
            return result;
          }
        } catch (error: unknown) {
          if (error instanceof OpenAI.AuthenticationError) {
            throw new BadRequestException(
              `${providerLabel} rejected the API key. Please check the key in your settings.`,
            );
          }

          if (error instanceof OpenAI.NotFoundError && llm.models.length === 1) {
            throw new BadRequestException(
              `Model "${model}" was not found. Please check the model name in your settings.`,
            );
          }

          rateLimited ||= error instanceof OpenAI.RateLimitError;
          this.logFailure(model, error);
        }
      }

      if (rateLimited) {
        throw new HttpException(
          'The AI provider is rate-limiting requests or the quota is exhausted. Please wait a minute and try again.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new BadGatewayException(
        llm.models.length > 1
          ? 'All free AI models are currently unavailable. Please try again later.'
          : 'The AI model did not return a usable answer. Please try again.',
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async tryModel(
    client: OpenAI,
    llm: ResolvedLlm,
    model: string,
    request: DaySummaryRequest,
    signal: AbortSignal,
  ): Promise<GeneratedText | null> {
    this.logger.log(`Trying model: ${model}`);

    const response = await this.completeWithTemperatureFallback(
      client,
      llm,
      model,
      request,
      signal,
    );

    const choice = response.choices[0];
    this.logger.debug(
      `raw response: model=${response.model} ` +
        `finish_reason=${choice.finish_reason} ` +
        `usage=${JSON.stringify(response.usage)} ` +
        `content=${JSON.stringify(choice.message.content).slice(0, 300)} ` +
        `reasoning=${JSON.stringify(choice.message)}`,
    );
    const content = choice.message.content?.trim();

    if (!content) {
      this.logger.warn(`Model ${model} returned empty content`);
      return null;
    }

    if (choice.finish_reason === 'length') {
      this.logger.warn(`Model ${model} output was truncated`);
      return null;
    }

    this.logger.log(`Success with model: ${model}`);
    return { text: content, model };
  }

  private async completeWithTemperatureFallback(
    client: OpenAI,
    llm: ResolvedLlm,
    model: string,
    request: DaySummaryRequest,
    signal: AbortSignal,
  ): Promise<OpenAI.Chat.ChatCompletion> {
    try {
      return await this.complete(client, llm, model, request, signal, true);
    } catch (error: unknown) {
      if (error instanceof OpenAI.BadRequestError && /temperature/i.test(error.message)) {
        return this.complete(client, llm, model, request, signal, false);
      }

      throw error;
    }
  }

  private complete(
    client: OpenAI,
    llm: ResolvedLlm,
    model: string,
    request: DaySummaryRequest,
    signal: AbortSignal,
    withTemperature: boolean,
  ): Promise<OpenAI.Chat.ChatCompletion> {
    const params: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: buildSystemPrompt(request.format, request.language) },
        { role: 'user', content: buildUserPrompt(request.facts) },
      ],
      [llm.tokenParam]: MAX_OUTPUT_TOKENS,
    };

    if (withTemperature) {
      params.temperature = TEMPERATURE;
    }

    if (llm.excludeReasoning) {
      params.reasoning = { exclude: true };
    }

    return client.chat.completions.create(
      params as unknown as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
      { signal, timeout: PER_MODEL_TIMEOUT_MS },
    );
  }

  private logFailure(model: string, error: unknown): void {
    const status: number | undefined =
      error instanceof OpenAI.APIError && typeof error.status === 'number'
        ? error.status
        : undefined;

    const message =
      error instanceof Error ? error.message.slice(0, MAX_LOGGED_MESSAGE_LENGTH) : String(error);

    this.logger.warn(`Model ${model} failed (status=${String(status)}): ${message}`);
  }
}

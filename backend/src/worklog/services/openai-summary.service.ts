import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import OpenAI from 'openai';

import type {
  AiSummaryGenerator,
  SummaryInputData,
} from '../interfaces/ai-summary-generator.interface';

@Injectable()
export class OpenAiSummaryService implements AiSummaryGenerator {
  private readonly logger = new Logger(OpenAiSummaryService.name);

  public async generate(input: SummaryInputData): Promise<string> {
    if (!input.apiKey) {
      throw new BadRequestException(
        'OpenAI API key is not configured. Please add it in your profile settings.',
      );
    }

    const openai = new OpenAI({ apiKey: input.apiKey });

    const prompt = `
        You are an AI assistant for developers. Generate a short, readable text (draft) for a daily worklog based on telemetry data.
        The text will be used for standups or client reports.

        Data for the period (${input.date}):
        - Total time: ${input.totalTime}
        - Projects: ${input.projects}
        - Branches: ${input.branches}
        - Languages: ${input.languages}
        - Focus Score: ${input.focusScore.toString()}/100

        Requirements:
        1. Write ONE concise paragraph in the first person ("I worked on...", "Implemented...").
        2. Natural, non-robotic tone.
        3. Mention main projects and branches.
        4. If Focus Score >= 80, highlight high productivity.
        5. Language: English. Do not use markdown formatting (asterisks, bold), just plain text.
    `;

    try {
      const keyLength = input.apiKey.length;
      this.logger.log(`Attempting OpenAI API call with key length: ${String(keyLength)}`);

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      });

      this.logger.log('OpenAI API call successful');

      return response.choices[0]?.message?.content?.trim() ?? 'Failed to generate summary.';
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`OpenAI API error: ${errorMessage}`, errorStack);

      if (error instanceof Error) {
        if (errorMessage.includes('401') || errorMessage.includes('authentication')) {
          throw new InternalServerErrorException(
            'Invalid OpenAI API key. Please check your API key in settings.',
          );
        }
        if (errorMessage.includes('429')) {
          throw new InternalServerErrorException(
            'OpenAI API rate limit exceeded. Please try again later.',
          );
        }
        if (errorMessage.includes('quota')) {
          throw new InternalServerErrorException(
            'OpenAI API quota exceeded. Please check your billing.',
          );
        }
      }

      throw new InternalServerErrorException(`Error contacting OpenAI API: ${errorMessage}`);
    }
  }
}

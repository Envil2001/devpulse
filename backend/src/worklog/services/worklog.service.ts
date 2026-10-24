import { createHash } from 'node:crypto';

import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { formatInTimeZone } from 'date-fns-tz';
import { Repository } from 'typeorm';

import { typeIdGenerator } from '@devpulse/lib';

import { User } from '../../users/entities/user.entity';
import type { WorklogFormat, WorklogLanguage } from '../constants/worklog.constants';
import {
  DATE_FORMAT,
  MAX_ACTIVE_DAYS,
  MAX_RANGE_DAYS,
  PROMPT_VERSION,
  WORKLOG_FORMATS,
  WORKLOG_LANGUAGES,
} from '../constants/worklog.constants';
import { WorklogEntry } from '../entities/worklog-entry.entity';
import {
  AI_SUMMARY_GENERATOR,
  type AiSummaryGenerator,
} from '../interfaces/ai-summary-generator.interface';
import type { DayFacts } from '../interfaces/day-facts.interface';
import type { LlmConfig } from '../interfaces/llm-config.interface';
import { WorklogDayResult, WorklogPlan } from '../interfaces/worklog-results.interface';
import { resolveLlm } from '../llm/llm-provider.presets';
import { assertDateKey, resolveRange } from '../utils/date-range';

import { DayFactsService } from './day-facts.service';

interface WorklogUser {
  id: User['id'];
  timezone: User['timezone'];
  openaiKey: User['openaiKey'];
  llmProvider: User['llmProvider'];
  llmModel: User['llmModel'];
  llmBaseUrl: User['llmBaseUrl'];
}

export interface GenerateDayInput {
  date: string;
  format: WorklogFormat;
  language: WorklogLanguage;
  force?: boolean;
}

@Injectable()
export class WorklogService {
  constructor(
    @Inject(AI_SUMMARY_GENERATOR)
    private readonly generator: AiSummaryGenerator,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(WorklogEntry)
    private readonly entryRepo: Repository<WorklogEntry>,
    private readonly dayFacts: DayFactsService,
  ) {}

  public async getPlan(
    userId: User['id'],
    startDate: string,
    endDate: string,
  ): Promise<WorklogPlan> {
    const user = await this.loadUser(userId);
    const llm = await resolveLlm(this.toLlmConfig(user));
    const range = resolveRange(startDate, endDate, user.timezone);
    const days = await this.dayFacts.collect(user.id, user.timezone, range);

    if (days.length === 0) {
      throw new NotFoundException(
        'No coding activity found for the selected period. Please select a date range with recorded work sessions.',
      );
    }

    const maxActiveDays = MAX_ACTIVE_DAYS[llm.tier];
    const activeMinutes = days.reduce((sum, day) => sum + day.activeMinutes, 0);
    const weightedFocus = days.reduce((sum, day) => sum + day.focusScore * day.activeMinutes, 0);

    return {
      startDate: range.startKey,
      endDate: range.endKey,
      limits: { maxRangeDays: MAX_RANGE_DAYS, maxActiveDays, tier: llm.tier },
      exceedsLimit: days.length > maxActiveDays,
      totals: {
        activeDays: days.length,
        activeMinutes,
        averageFocusScore: Math.round(weightedFocus / activeMinutes),
      },
      days: days.map((day) => ({
        date: day.date,
        activeMinutes: day.activeMinutes,
        focusScore: day.focusScore,
        projects: day.projects.map((project) => project.name),
      })),
    };
  }

  public async generateDay(userId: User['id'], input: GenerateDayInput): Promise<WorklogDayResult> {
    const { date, format, language, force = false } = input;

    this.assertInput(date, format, language);

    const user = await this.loadUser(userId);
    const config = this.toLlmConfig(user);

    if (date > formatInTimeZone(new Date(), user.timezone, DATE_FORMAT)) {
      throw new BadRequestException('Cannot generate a worklog for a future date.');
    }

    const range = resolveRange(date, date, user.timezone);
    const days = await this.dayFacts.collect(user.id, user.timezone, range);

    if (days.length === 0) {
      throw new NotFoundException('No coding activity found for this day.');
    }

    const facts = days[0];

    const factsHash = this.hashFacts(facts, format, language);
    const existing = await this.entryRepo.findOneBy({ userId: user.id, date, format, language });

    if (existing && !force && existing.factsHash === factsHash) {
      return { date, text: existing.text, model: existing.model, cached: true };
    }

    const { text, model } = await this.generator.generate({ facts, format, language }, config);

    const entry =
      existing ??
      this.entryRepo.create({
        id: typeIdGenerator('worklogEntries'),
        userId: user.id,
        date,
        format,
        language,
      });

    entry.factsHash = factsHash;
    entry.text = text;
    entry.model = model;
    await this.entryRepo.save(entry);

    entry.factsHash = factsHash;
    entry.text = text;
    entry.model = model;
    await this.entryRepo.save(entry);

    return { date, text, model, cached: false };
  }

  private assertInput(date: string, format: string, language: string): void {
    assertDateKey(date);

    if (!(WORKLOG_FORMATS as ReadonlyArray<string>).includes(format)) {
      throw new BadRequestException('Unknown worklog format.');
    }

    if (!(WORKLOG_LANGUAGES as ReadonlyArray<string>).includes(language)) {
      throw new BadRequestException('Unknown worklog language.');
    }
  }

  private async loadUser(userId: User['id']): Promise<WorklogUser> {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.timezone',
        'user.openaiKey',
        'user.llmProvider',
        'user.llmModel',
        'user.llmBaseUrl',
      ])
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  private toLlmConfig(user: WorklogUser): LlmConfig {
    if (!user.openaiKey) {
      throw new BadRequestException(
        'AI provider key is not configured. Please add it in Settings.',
      );
    }

    return {
      provider: user.llmProvider ?? 'openrouter',
      apiKey: user.openaiKey,
      model: user.llmModel,
      baseUrl: user.llmBaseUrl,
    };
  }

  private hashFacts(facts: DayFacts, format: WorklogFormat, language: WorklogLanguage): string {
    return createHash('sha256')
      .update(JSON.stringify({ facts, format, language, promptVersion: PROMPT_VERSION }))
      .digest('hex');
  }
}

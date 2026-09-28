import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { addDays, differenceInCalendarDays, format, isValid, parseISO } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { Repository } from 'typeorm';

import { WorkSession } from '../../telemetry/entities/work-session.entity';
import { User } from '../../users/entities/user.entity';
import {
  AI_SUMMARY_GENERATOR,
  type AiSummaryGenerator,
} from '../interfaces/ai-summary-generator.interface';

const DATE_FORMAT = 'yyyy-MM-dd';
const MAX_RANGE_DAYS = 31;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

interface UtcRange {
  startKey: string;
  endKey: string;
  start: Date;
  endExclusive: Date;
}

interface SessionAggregate {
  totalActiveSeconds: number;
  weightedFocus: number;
  branches: Set<string>;
  projects: Map<string, number>;
  languages: Map<string, number>;
}

@Injectable()
export class WorklogService {
  constructor(
    @Inject(AI_SUMMARY_GENERATOR)
    private readonly aiSummaryGenerator: AiSummaryGenerator,
    @InjectRepository(WorkSession)
    private readonly workSessionRepo: Repository<WorkSession>,
  ) {}

  public async generatePeriodWorklog(
    user: User,
    startDateStr: string,
    endDateStr: string,
  ): Promise<{ date: string; summary: string }> {
    const apiKey = user.openaiKey;

    if (!apiKey) {
      throw new BadRequestException(
        'OpenAI API key is not configured. Please add it in your profile settings.',
      );
    }

    const range = this.resolveRange(startDateStr, endDateStr, user.timezone);

    const sessions = await this.workSessionRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.project', 'project')
      .where('session.user_id = :userId', { userId: user.id })
      .andWhere('session.started_at >= :start', { start: range.start })
      .andWhere('session.started_at < :endExclusive', { endExclusive: range.endExclusive })
      .getMany();

    const aggregate = this.aggregate(sessions);

    if (aggregate.totalActiveSeconds === 0) {
      throw new NotFoundException(
        'No coding activity found for the selected period. Please select a date range with recorded work sessions.',
      );
    }

    const period = `${range.startKey} to ${range.endKey}`;

    const summary = await this.aiSummaryGenerator.generate({
      apiKey,
      date: period,
      totalTime: this.formatSeconds(aggregate.totalActiveSeconds),
      projects: this.formatProjects(aggregate.projects),
      branches: [...aggregate.branches].join(', ') || 'Unknown branch',
      languages: this.formatLanguages(aggregate.languages),
      focusScore: Math.round(aggregate.weightedFocus / aggregate.totalActiveSeconds),
    });

    return { date: period, summary };
  }

  private resolveRange(startDateStr: string, endDateStr: string, timezone: string): UtcRange {
    const startDay = parseISO(startDateStr);
    const endDay = parseISO(endDateStr);

    if (!isValid(startDay) || !isValid(endDay)) {
      throw new BadRequestException('Dates must be in YYYY-MM-DD format.');
    }

    const daysBetween = differenceInCalendarDays(endDay, startDay);

    if (daysBetween < 0) {
      throw new BadRequestException('Start date must not be after end date.');
    }

    if (daysBetween + 1 > MAX_RANGE_DAYS) {
      throw new BadRequestException(`Period must not exceed ${MAX_RANGE_DAYS.toString()} days.`);
    }

    const startKey = format(startDay, DATE_FORMAT);
    const endKey = format(endDay, DATE_FORMAT);
    const dayAfterEndKey = format(addDays(endDay, 1), DATE_FORMAT);

    return {
      startKey,
      endKey,
      start: fromZonedTime(`${startKey}T00:00:00`, timezone),
      endExclusive: fromZonedTime(`${dayAfterEndKey}T00:00:00`, timezone),
    };
  }

  private aggregate(sessions: Array<WorkSession>): SessionAggregate {
    const aggregate: SessionAggregate = {
      totalActiveSeconds: 0,
      weightedFocus: 0,
      branches: new Set<string>(),
      projects: new Map<string, number>(),
      languages: new Map<string, number>(),
    };

    for (const session of sessions) {
      const active = session.activeSeconds;

      aggregate.totalActiveSeconds += active;
      aggregate.weightedFocus += session.focusScore * active;

      if (session.gitBranch) {
        aggregate.branches.add(session.gitBranch);
      }

      if (session.project?.name) {
        this.addSeconds(aggregate.projects, session.project.name, active);
      }

      if (session.primaryLanguage) {
        this.addSeconds(aggregate.languages, session.primaryLanguage, active);
      }
    }

    return aggregate;
  }

  private addSeconds(target: Map<string, number>, key: string, seconds: number): void {
    target.set(key, (target.get(key) ?? 0) + seconds);
  }

  private sortByDuration(source: Map<string, number>): Array<[string, number]> {
    return [...source.entries()].sort(([, first], [, second]) => second - first);
  }

  private formatProjects(projects: Map<string, number>): string {
    return (
      this.sortByDuration(projects)
        .map(([name, seconds]) => `${name} (${this.formatSeconds(seconds)})`)
        .join(', ') || 'No project'
    );
  }

  private formatLanguages(languages: Map<string, number>): string {
    const total = [...languages.values()].reduce((sum, seconds) => sum + seconds, 0);

    if (total === 0) {
      return 'Not defined';
    }

    return this.sortByDuration(languages)
      .map(
        ([language, seconds]) => `${language} ${Math.round((seconds / total) * 100).toString()}%`,
      )
      .join(', ');
  }

  private formatSeconds(seconds: number): string {
    const hours = Math.floor(seconds / SECONDS_PER_HOUR);
    const minutes = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);

    if (hours > 0) {
      return `${hours.toString()}h ${minutes.toString()}m`;
    }

    return `${minutes.toString()}m`;
  }
}

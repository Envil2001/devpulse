import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { type TypeId } from '@devpulse/lib';

import { WorkSession } from '../telemetry/entities/work-session.entity';

import { type GetAnalyticsBranchesResponseDto } from './dto/get-analytics-branches-response.dto';
import { type GetAnalyticsDashboardResponseDto } from './dto/get-analytics-dashboard-response.dto';
import { type GetAnalyticsRangeRequestDto } from './dto/get-analytics-range-request.dto';
import { type GetAnalyticsTimeseriesResponseDto } from './dto/get-analytics-timeseries-response.dto';

const DEFAULT_RANGE_DAYS = 7;
const MS_PER_HOUR = 3_600_000;

interface ResolvedRange {
  from: Date;
  to: Date;
}

interface SummaryAggregateRow {
  activeMs: string | null;
  trackedMs: string | null;
  sessionCount: string | null;
}

interface BranchAggregateRow extends SummaryAggregateRow {
  gitBranch: string;
}

interface TimeseriesAggregateRow extends SummaryAggregateRow {
  day: Date | string;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(WorkSession)
    private readonly sessionsRepository: Repository<WorkSession>,
  ) {}

  public async getDashboardSummary(
    userId: TypeId<'users'>,
    query: GetAnalyticsRangeRequestDto,
  ): Promise<GetAnalyticsDashboardResponseDto> {
    const range = this.resolveRange(query);

    const row = await this.sessionsRepository
      .createQueryBuilder('session')
      .select('COALESCE(SUM(session.activeDurationMs), 0)', 'activeMs')
      .addSelect(
        'COALESCE(SUM(COALESCE(session.totalDurationMs, session.activeDurationMs)), 0)',
        'trackedMs',
      )
      .addSelect('COUNT(session.id)', 'sessionCount')
      .where('session.userId = :userId', { userId })
      .andWhere('session.startedAt >= :from AND session.startedAt <= :to', range)
      .getRawOne<SummaryAggregateRow>();

    const activeMs = this.toInt(row?.activeMs);
    const trackedMs = this.toInt(row?.trackedMs);
    const sessionCount = this.toInt(row?.sessionCount);

    return {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      sessionCount,
      totalActiveMs: activeMs,
      totalTrackedMs: trackedMs,
      totalHours: this.toHours(activeMs),
      focusScore: this.toFocusScore(activeMs, trackedMs),
    };
  }

  public async getBranchesBreakdown(
    userId: TypeId<'users'>,
    query: GetAnalyticsRangeRequestDto,
  ): Promise<GetAnalyticsBranchesResponseDto> {
    const range = this.resolveRange(query);

    const rows = await this.sessionsRepository
      .createQueryBuilder('session')
      .select('session.gitBranch', 'gitBranch')
      .addSelect('COALESCE(SUM(session.activeDurationMs), 0)', 'activeMs')
      .addSelect(
        'COALESCE(SUM(COALESCE(session.totalDurationMs, session.activeDurationMs)), 0)',
        'trackedMs',
      )
      .addSelect('COUNT(session.id)', 'sessionCount')
      .where('session.userId = :userId', { userId })
      .andWhere('session.startedAt >= :from AND session.startedAt <= :to', range)
      .andWhere('session.gitBranch IS NOT NULL')
      .groupBy('session.gitBranch')
      .orderBy('activeMs', 'DESC')
      .getRawMany<BranchAggregateRow>();

    return {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      branches: rows.map((row) => {
        const activeMs = this.toInt(row.activeMs);
        const trackedMs = this.toInt(row.trackedMs);
        return {
          gitBranch: row.gitBranch,
          sessionCount: this.toInt(row.sessionCount),
          totalActiveMs: activeMs,
          totalTrackedMs: trackedMs,
          totalHours: this.toHours(activeMs),
          focusScore: this.toFocusScore(activeMs, trackedMs),
        };
      }),
    };
  }

  public async getTimeseries(
    userId: TypeId<'users'>,
    query: GetAnalyticsRangeRequestDto,
  ): Promise<GetAnalyticsTimeseriesResponseDto> {
    const range = this.resolveRange(query);

    const rows = await this.sessionsRepository
      .createQueryBuilder('session')
      .select("DATE_TRUNC('day', session.startedAt)", 'day')
      .addSelect('COALESCE(SUM(session.activeDurationMs), 0)', 'activeMs')
      .addSelect(
        'COALESCE(SUM(COALESCE(session.totalDurationMs, session.activeDurationMs)), 0)',
        'trackedMs',
      )
      .addSelect('COUNT(session.id)', 'sessionCount')
      .where('session.userId = :userId', { userId })
      .andWhere('session.startedAt >= :from AND session.startedAt <= :to', range)
      .groupBy("DATE_TRUNC('day', session.startedAt)")
      .orderBy('day', 'ASC')
      .getRawMany<TimeseriesAggregateRow>();

    return {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      items: rows.map((row) => {
        const activeMs = this.toInt(row.activeMs);
        const trackedMs = this.toInt(row.trackedMs);
        return {
          day: this.toIsoDay(row.day),
          sessionCount: this.toInt(row.sessionCount),
          totalActiveMs: activeMs,
          totalTrackedMs: trackedMs,
          totalHours: this.toHours(activeMs),
          focusScore: this.toFocusScore(activeMs, trackedMs),
        };
      }),
    };
  }

  private resolveRange(query: GetAnalyticsRangeRequestDto): ResolvedRange {
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);
    const from = query.from === undefined ? defaultFrom : new Date(query.from);
    const to = query.to === undefined ? now : new Date(query.to);

    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new BadRequestException('Invalid date range');
    }
    if (from > to) {
      throw new BadRequestException('"from" must be less than or equal to "to"');
    }

    return { from, to };
  }

  private toInt(value: string | null | undefined): number {
    if (value === undefined || value === null) {
      return 0;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private toHours(activeMs: number): number {
    return Math.round((activeMs / MS_PER_HOUR) * 100) / 100;
  }

  private toIsoDay(day: Date | string): string {
    const date = day instanceof Date ? day : new Date(day);
    return date.toISOString().slice(0, 10);
  }

  private toFocusScore(activeMs: number, trackedMs: number): number {
    if (trackedMs <= 0) {
      return 0;
    }
    return Math.round((activeMs / trackedMs) * 10_000) / 100;
  }
}

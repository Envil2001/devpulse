import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { TypeId } from '@devpulse/lib';

import { WorkSession } from '../../telemetry/entities/work-session.entity';
import { User } from '../../users/entities/user.entity';
import { GetAnalyticsRangeRequestDto } from '../dto/request/get-analytics-range-request.dto';
import { GetAnalyticsBranchesResponseDto } from '../dto/response/get-analytics-branches-response.dto';
import { GetAnalyticsDashboardResponseDto } from '../dto/response/get-analytics-dashboard-response.dto';
import { GetAnalyticsTimeseriesResponseDto } from '../dto/response/get-analytics-timeseries-response.dto';
import {
  BranchDistributionRaw,
  DashboardStatsRaw,
  TimeseriesRaw,
  TopLanguageRaw,
} from '../interfaces/analytics-raw.interfaces';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(WorkSession)
    private readonly sessionRepo: Repository<WorkSession>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private applyBaseFilters(
    qb: SelectQueryBuilder<WorkSession>,
    userId: TypeId<'users'>,
    query: GetAnalyticsRangeRequestDto,
  ): SelectQueryBuilder<WorkSession> {
    qb.where('session.user_id = :userId', { userId });

    if (query.projectId) {
      qb.andWhere('session.project_id = :projectId', { projectId: query.projectId });
    }
    if (query.startDate) {
      qb.andWhere('session.started_at >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere('session.started_at <= :endDate', { endDate: query.endDate });
    }

    return qb;
  }

  public async getDashboardStats(
    userId: TypeId<'users'>,
    query: GetAnalyticsRangeRequestDto,
  ): Promise<GetAnalyticsDashboardResponseDto> {
    this.logger.log(`Fetching dashboard stats for user: ${userId}`);

    const qbStats = this.applyBaseFilters(
      this.sessionRepo.createQueryBuilder('session'),
      userId,
      query,
    );

    const weightedFocusSql =
      'SUM(session.focus_score * session.active_seconds) / NULLIF(SUM(session.active_seconds), 0)';

    const stats = await qbStats
      .select('SUM(session.active_seconds)', 'totalActiveSeconds')
      .addSelect('SUM(session.earned_money)', 'totalEarnedMoney')
      .addSelect(weightedFocusSql, 'averageFocusScore')
      .addSelect('COUNT(session.id)', 'totalSessionsCount')
      .getRawOne<DashboardStatsRaw>();

    const qbLang = this.applyBaseFilters(
      this.sessionRepo.createQueryBuilder('session'),
      userId,
      query,
    ).andWhere('session.primary_language IS NOT NULL');

    const topLanguageResult = await qbLang
      .select('session.primary_language', 'language')
      .addSelect('SUM(session.active_seconds)', 'totalTime')
      .groupBy('session.primary_language')
      .orderBy('"totalTime"', 'DESC')
      .limit(1)
      .getRawOne<TopLanguageRaw>();

    return {
      totalActiveSeconds: Number(stats?.totalActiveSeconds ?? 0),
      totalEarnedMoney: Number(stats?.totalEarnedMoney ?? 0),
      averageFocusScore: Math.round(Number(stats?.averageFocusScore ?? 0)),
      totalSessionsCount: Number(stats?.totalSessionsCount ?? 0),
      topLanguage: topLanguageResult?.language ?? null,
    };
  }

  public async getTimeseries(
    userId: TypeId<'users'>,
    query: GetAnalyticsRangeRequestDto,
  ): Promise<GetAnalyticsTimeseriesResponseDto> {
    this.logger.log(`Fetching timeseries for user: ${userId}`);

    const user = await this.userRepo.findOne({ where: { id: userId }, select: ['id', 'timezone'] });
    const timezone = user?.timezone ?? 'UTC';

    const qb = this.applyBaseFilters(this.sessionRepo.createQueryBuilder('session'), userId, query);

    const dateTruncSql = "TO_CHAR(session.started_at AT TIME ZONE :timezone, 'YYYY-MM-DD')";

    const rawData = await qb
      .select(dateTruncSql, 'date')
      .addSelect('SUM(session.active_seconds)', 'activeSeconds')
      .addSelect('SUM(session.earned_money)', 'earnedMoney')
      .setParameter('timezone', timezone)
      .groupBy(dateTruncSql)
      .orderBy('"date"', 'ASC')
      .getRawMany<TimeseriesRaw>();

    const series = rawData.map((row) => ({
      date: row.date,
      activeSeconds: Number(row.activeSeconds ?? 0),
      earnedMoney: Number(row.earnedMoney ?? 0),
    }));

    return { series };
  }

  public async getBranchesDistribution(
    userId: TypeId<'users'>,
    query: GetAnalyticsRangeRequestDto,
  ): Promise<GetAnalyticsBranchesResponseDto> {
    const qb = this.applyBaseFilters(
      this.sessionRepo.createQueryBuilder('session'),
      userId,
      query,
    ).andWhere('session.git_branch IS NOT NULL');

    const rawData = await qb
      .select('session.git_branch', 'branchName')
      .addSelect('SUM(session.active_seconds)', 'activeSeconds')
      .groupBy('session.git_branch')
      .orderBy('"activeSeconds"', 'DESC')
      .limit(10)
      .getRawMany<BranchDistributionRaw>();

    const branches = rawData.map((row) => ({
      branchName: row.branchName ?? 'unknown',
      activeSeconds: Number(row.activeSeconds ?? 0),
    }));

    return { branches };
  }
}

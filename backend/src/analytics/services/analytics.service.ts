import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TypeId } from '@devpulse/lib';

import { WorkSession } from '../../telemetry/entities/work-session.entity';
import { GetAnalyticsRangeRequestDto } from '../dto/request/get-analytics-range-request.dto';
import { GetAnalyticsBranchesResponseDto } from '../dto/response/get-analytics-branches-response.dto';
import { GetAnalyticsDashboardResponseDto } from '../dto/response/get-analytics-dashboard-response.dto';
import { GetAnalyticsTimeseriesResponseDto } from '../dto/response/get-analytics-timeseries-response.dto';

interface DashboardStatsRaw {
  totalActiveSeconds: string | null;
  totalEarnedMoney: string | null;
  averageFocusScore: string | null;
  totalSessionsCount: string | null;
}

interface TopLanguageRaw {
  language: string | null;
  totalTime: string | null;
}

interface TimeseriesRaw {
  date: Date | string;
  activeSeconds: string | null;
  earnedMoney: string | null;
}

interface BranchDistributionRaw {
  branchName: string | null;
  activeSeconds: string | null;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  constructor(
    @InjectRepository(WorkSession)
    private readonly sessionRepo: Repository<WorkSession>,
  ) {}

  public async getDashboardStats(
    userId: TypeId<'users'>,
    query: GetAnalyticsRangeRequestDto,
  ): Promise<GetAnalyticsDashboardResponseDto> {
    this.logger.log(`Fetching dashboard stats for user: ${userId}`);

    const qb = this.sessionRepo
      .createQueryBuilder('session')
      .where('session.user_id = :userId', { userId });

    if (query.startDate) {
      qb.andWhere('session.started_at >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere('session.started_at <= :endDate', { endDate: query.endDate });
    }

    const stats = await qb
      .select('SUM(session.active_seconds)', 'totalActiveSeconds')
      .addSelect('SUM(session.earned_money)', 'totalEarnedMoney')
      .addSelect('AVG(session.focus_score)', 'averageFocusScore')
      .addSelect('COUNT(session.id)', 'totalSessionsCount')
      .getRawOne<DashboardStatsRaw>();

    const topLanguageResult = await this.sessionRepo
      .createQueryBuilder('session')
      .select('session.primary_language', 'language')
      .addSelect('SUM(session.active_seconds)', 'totalTime')
      .where('session.user_id = :userId', { userId })
      .andWhere('session.primary_language IS NOT NULL')
      .groupBy('session.primary_language')
      .orderBy('"totalTime"', 'DESC')
      .limit(1)
      .getRawOne<TopLanguageRaw>();

    return {
      totalActiveSeconds: Number(stats?.totalActiveSeconds ?? 0),
      totalEarnedMoney: Number(stats?.totalEarnedMoney ?? 0),
      averageFocusScore: Number(stats?.averageFocusScore ?? 0),
      totalSessionsCount: Number(stats?.totalSessionsCount ?? 0),
      topLanguage: topLanguageResult?.language ?? null,
    };
  }

  public async getTimeseries(
    userId: TypeId<'users'>,
    query: GetAnalyticsRangeRequestDto,
  ): Promise<GetAnalyticsTimeseriesResponseDto> {
    this.logger.log(`Fetching timeseries for user: ${userId}`);

    const qb = this.sessionRepo
      .createQueryBuilder('session')
      .where('session.user_id = :userId', { userId });

    if (query.startDate) {
      qb.andWhere('session.started_at >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere('session.started_at <= :endDate', { endDate: query.endDate });
    }

    const rawData = await qb
      .select('DATE(session.started_at)', 'date')
      .addSelect('SUM(session.active_seconds)', 'activeSeconds')
      .addSelect('SUM(session.earned_money)', 'earnedMoney')
      .groupBy('DATE(session.started_at)')
      .orderBy('DATE(session.started_at)', 'ASC')
      .getRawMany<TimeseriesRaw>();

    const series = rawData.map((row) => {
      let dateStr: string;
      if (row.date instanceof Date) {
        dateStr = row.date.toISOString().split('T')[0] ?? '';
      } else if (typeof row.date === 'string') {
        dateStr = new Date(row.date).toISOString().split('T')[0] ?? '';
      } else {
        dateStr = '';
      }

      return {
        date: dateStr,
        activeSeconds: Number(row.activeSeconds ?? 0),
        earnedMoney: Number(row.earnedMoney ?? 0),
      };
    });

    return { series };
  }

  public async getBranchesDistribution(
    userId: TypeId<'users'>,
    _query: GetAnalyticsRangeRequestDto,
  ): Promise<GetAnalyticsBranchesResponseDto> {
    const rawData = await this.sessionRepo
      .createQueryBuilder('session')
      .select('session.git_branch', 'branchName')
      .addSelect('SUM(session.active_seconds)', 'activeSeconds')
      .where('session.user_id = :userId', { userId })
      .andWhere('session.git_branch IS NOT NULL')
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

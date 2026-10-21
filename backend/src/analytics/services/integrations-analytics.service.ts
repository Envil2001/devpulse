import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { formatDuration, type TypeId } from '@devpulse/lib';

import { WorkSession, WorkSessionStatus } from '../../telemetry/entities/work-session.entity';
import { User } from '../../users/entities/user.entity';
import { GetAnalyticsRangeRequestDto } from '../dto/request/get-analytics-range-request.dto';
import { GetIntegrationAiRoiResponseDto } from '../dto/response/get-integration-ai-roi-response.dto';
import { GetIntegrationLanguagesResponseDto } from '../dto/response/get-integration-languages-response.dto';
import { GetIntegrationSessionItemDto } from '../dto/response/get-integration-sessions-response.dto';
import { GetIntegrationStatusResponseDto } from '../dto/response/get-integration-status-response.dto';
import { GetIntegrationTodayResponseDto } from '../dto/response/get-integration-today-response.dto';

const LIVE_SESSION_TIMEOUT_MS = 5 * 60 * 1000;
const SECONDS_PER_HOUR = 3600;
const MIN_COMPARISON_SECONDS = SECONDS_PER_HOUR;
const DAY_KEY_FORMAT = 'yyyy-MM-dd';
const OTHER_LANGUAGE_LABEL = 'Other';

const OFFLINE_STATUS: GetIntegrationStatusResponseDto = {
  isCodingNow: false,
  currentProject: null,
  currentBranch: null,
  currentLanguage: null,
  currentSessionDurationSeconds: null,
  sessionStartedAt: null,
};

interface LanguageRow {
  language: string;
  totalSeconds: string;
}

interface UsageBucket {
  seconds: number;
  lines: number;
  sessions: number;
  interactions: number;
}

function emptyBucket(): UsageBucket {
  return { seconds: 0, lines: 0, sessions: 0, interactions: 0 };
}

function linesPerHour(bucket: UsageBucket): number {
  const hours = bucket.seconds / SECONDS_PER_HOUR;
  return hours > 0 ? Math.round(bucket.lines / hours) : 0;
}

@Injectable()
export class IntegrationsAnalyticsService {
  constructor(
    @InjectRepository(WorkSession)
    private readonly sessionRepo: Repository<WorkSession>,
  ) {}

  public async getTodaySummary(user: User): Promise<GetIntegrationTodayResponseDto> {
    const now = new Date();

    const dateKey = formatInTimeZone(now, user.timezone, DAY_KEY_FORMAT);

    const startOfDayUtc = fromZonedTime(`${dateKey}T00:00:00`, user.timezone);

    const sessions = await this.sessionRepo
      .createQueryBuilder('session')
      .where('session.user_id = :userId', { userId: user.id })
      .andWhere('session.started_at >= :startOfDay', { startOfDay: startOfDayUtc })
      .getMany();

    const totalActiveSeconds = sessions.reduce((sum, session) => sum + session.activeSeconds, 0);
    const totalEarned = sessions.reduce((sum, session) => sum + session.earnedMoney, 0);
    const weightedFocus = sessions.reduce(
      (sum, session) => sum + session.focusScore * session.activeSeconds,
      0,
    );

    return {
      date: dateKey,
      timezone: user.timezone,
      currency: user.currency,
      totalActiveSeconds,
      formattedTime: formatDuration(totalActiveSeconds),
      totalEarnedMoney: Math.round(totalEarned * 100) / 100,
      averageFocusScore:
        totalActiveSeconds > 0 ? Math.round(weightedFocus / totalActiveSeconds) : 0,
      sessionsCount: sessions.length,
    };
  }

  public async getRecentSessions(
    userId: TypeId<'users'>,
    limit: number,
    projectId?: string,
  ): Promise<Array<GetIntegrationSessionItemDto>> {
    const qb = this.sessionRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.project', 'project')
      .where('session.user_id = :userId', { userId })
      .orderBy('session.started_at', 'DESC')
      .take(limit);

    if (projectId) {
      qb.andWhere('session.project_id = :projectId', { projectId });
    }

    const sessions = await qb.getMany();

    return sessions.map((session) => ({
      id: session.id,
      projectName: session.project?.name ?? 'Unknown',
      gitBranch: session.gitBranch,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      durationSeconds: session.activeSeconds,
      focusScore: session.focusScore,
      earnedMoney: session.earnedMoney,
    }));
  }

  public async getLiveStatus(userId: TypeId<'users'>): Promise<GetIntegrationStatusResponseDto> {
    const activeSession = await this.sessionRepo.findOne({
      where: { userId, status: WorkSessionStatus.ACTIVE },
      relations: ['project'],
      order: { endedAt: 'DESC' },
    });

    if (!activeSession) {
      return OFFLINE_STATUS;
    }

    const lastSeenMs = (activeSession.endedAt ?? activeSession.startedAt).getTime();

    if (Date.now() - lastSeenMs > LIVE_SESSION_TIMEOUT_MS) {
      return OFFLINE_STATUS;
    }

    return {
      isCodingNow: true,
      currentProject: activeSession.project?.name ?? null,
      currentBranch: activeSession.gitBranch,
      currentLanguage: activeSession.currentLanguage ?? activeSession.primaryLanguage,
      currentSessionDurationSeconds: activeSession.activeSeconds,
      sessionStartedAt: activeSession.startedAt,
    };
  }

  public async getLanguagesBreakdown(
    userId: TypeId<'users'>,
    query: GetAnalyticsRangeRequestDto = {},
  ): Promise<GetIntegrationLanguagesResponseDto> {
    const conditions = ['ws.user_id = $1'];
    const params: Array<string> = [userId];

    const addCondition = (column: string, operator: string, value: string): void => {
      params.push(value);
      conditions.push(`${column} ${operator} $${String(params.length)}`);
    };

    if (query.projectId) addCondition('ws.project_id', '=', query.projectId);
    if (query.startDate) addCondition('ws.started_at', '>=', query.startDate);
    if (query.endDate) addCondition('ws.started_at', '<=', query.endDate);

    const rows = await this.sessionRepo.manager.query<Array<LanguageRow>>(
      `
      SELECT lang.key AS language,
             SUM((lang.value)::int) AS "totalSeconds"
      FROM work_sessions ws,
           LATERAL jsonb_each_text(
             CASE
               WHEN COALESCE(ws.language_seconds, '{}'::jsonb) = '{}'::jsonb
                 THEN jsonb_build_object(
                   COALESCE(ws.primary_language, '${OTHER_LANGUAGE_LABEL}'),
                   ws.active_seconds
                 )
               ELSE ws.language_seconds
             END
           ) AS lang(key, value)
      WHERE ${conditions.join(' AND ')}
      GROUP BY lang.key
      ORDER BY "totalSeconds" DESC
      `,
      params,
    );

    const parsed = rows.map((row) => ({
      language: row.language,
      seconds: Number.parseInt(row.totalSeconds, 10) || 0,
    }));
    const totalActiveSeconds = parsed.reduce((sum, row) => sum + row.seconds, 0);

    return {
      totalActiveSeconds,
      languages: parsed.map(({ language, seconds }) => ({
        language,
        activeSeconds: seconds,
        formattedTime: formatDuration(seconds),
        percentage: Number(
          ((totalActiveSeconds > 0 ? seconds / totalActiveSeconds : 0) * 100).toFixed(1),
        ),
      })),
    };
  }

  public async getAiRoiMetrics(
    userId: TypeId<'users'>,
    query: GetAnalyticsRangeRequestDto = {},
  ): Promise<GetIntegrationAiRoiResponseDto> {
    const qb = this.sessionRepo
      .createQueryBuilder('session')
      .select([
        'session.id',
        'session.activeSeconds',
        'session.aiAssisted',
        'session.aiInteractionsCount',
        'session.commits',
      ])
      .where('session.user_id = :userId', { userId });

    this.applyRange(qb, query);

    const sessions = await qb.getMany();

    const ai = emptyBucket();
    const manual = emptyBucket();

    for (const session of sessions) {
      const bucket = session.aiAssisted || session.aiInteractionsCount > 0 ? ai : manual;

      bucket.sessions += 1;
      bucket.seconds += session.activeSeconds;
      bucket.interactions += session.aiInteractionsCount;
      bucket.lines += session.commits.reduce(
        (sum, commit) => sum + commit.insertions + commit.deletions,
        0,
      );
    }

    const aiVelocity = linesPerHour(ai);
    const manualVelocity = linesPerHour(manual);
    const comparable =
      ai.seconds >= MIN_COMPARISON_SECONDS && manual.seconds >= MIN_COMPARISON_SECONDS;

    const speedupPercentage =
      comparable && manualVelocity > 0 && aiVelocity > manualVelocity
        ? Number((((aiVelocity - manualVelocity) / manualVelocity) * 100).toFixed(1))
        : 0;

    const expectedHoursWithoutAi = comparable && manualVelocity > 0 ? ai.lines / manualVelocity : 0;
    const estimatedHoursSaved = Math.max(
      0,
      Number((expectedHoursWithoutAi - ai.seconds / SECONDS_PER_HOUR).toFixed(1)),
    );

    return {
      aiSessionsCount: ai.sessions,
      manualSessionsCount: manual.sessions,
      totalAiInteractions: ai.interactions,
      aiVelocityLinesPerHour: aiVelocity,
      manualVelocityLinesPerHour: manualVelocity,
      speedupPercentage,
      estimatedHoursSaved,
    };
  }

  private applyRange(
    qb: SelectQueryBuilder<WorkSession>,
    query: GetAnalyticsRangeRequestDto,
  ): void {
    if (query.projectId) {
      qb.andWhere('session.project_id = :projectId', { projectId: query.projectId });
    }
    if (query.startDate) {
      qb.andWhere('session.started_at >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere('session.started_at <= :endDate', { endDate: query.endDate });
    }
  }
}

import path from 'node:path';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { formatDuration, type HotPathMetric, type TypeId } from '@devpulse/lib';

import { WorkSession, WorkSessionStatus } from '../../telemetry/entities/work-session.entity';
import { User } from '../../users/entities/user.entity';
import { GetAnalyticsRangeRequestDto } from '../dto/request/get-analytics-range-request.dto';
import { GetAnalyticsHotFilesResponseDto } from '../dto/response/get-analytics-hot-files-response.dto';
import { GetIntegrationAiRoiResponseDto } from '../dto/response/get-integration-ai-roi-response.dto';
import { GetIntegrationLanguagesResponseDto } from '../dto/response/get-integration-languages-response.dto';
import { GetIntegrationSessionItemDto } from '../dto/response/get-integration-sessions-response.dto';
import {
  GetIntegrationStatusResponseDto,
  type TrackerInactiveReason,
} from '../dto/response/get-integration-status-response.dto';
import { GetIntegrationTodayResponseDto } from '../dto/response/get-integration-today-response.dto';

const LIVE_SESSION_TIMEOUT_MS = 5 * 60 * 1000;
const SECONDS_PER_HOUR = 3600;
const MIN_COMPARISON_SECONDS = SECONDS_PER_HOUR;
const DAY_KEY_FORMAT = 'yyyy-MM-dd';
const OTHER_LANGUAGE_LABEL = 'Other';
const HOT_PATHS_LIMIT = 5;

function inactiveStatus(
  inactiveReason: TrackerInactiveReason,
  lastSignalAt: Date | null,
): GetIntegrationStatusResponseDto {
  return {
    isCodingNow: false,
    currentProject: null,
    currentBranch: null,
    currentLanguage: null,
    currentSessionDurationSeconds: null,
    sessionStartedAt: null,
    inactiveReason,
    lastSignalAt,
  };
}

interface LanguageRow {
  language: string;
  totalSeconds: string;
}

interface FileActivityRow {
  path: string;
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
    const latestSession = await this.sessionRepo.findOne({
      where: { userId },
      relations: ['project'],
      order: { endedAt: 'DESC' },
    });

    if (!latestSession) {
      return inactiveStatus('no-data', null);
    }

    const lastSignalAt = latestSession.endedAt ?? latestSession.startedAt;

    if (latestSession.status !== WorkSessionStatus.ACTIVE) {
      return inactiveStatus('session-closed', lastSignalAt);
    }

    if (Date.now() - lastSignalAt.getTime() > LIVE_SESSION_TIMEOUT_MS) {
      return inactiveStatus('signal-stale', lastSignalAt);
    }

    return {
      isCodingNow: true,
      currentProject: latestSession.project?.name ?? null,
      currentBranch: latestSession.gitBranch,
      currentLanguage: latestSession.currentLanguage ?? latestSession.primaryLanguage,
      currentSessionDurationSeconds: latestSession.activeSeconds,
      sessionStartedAt: latestSession.startedAt,
      inactiveReason: null,
      lastSignalAt,
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

    const parsed = rows.map((row) => {
      const seconds = Number.parseInt(row.totalSeconds, 10);
      return {
        language: row.language,
        seconds: Number.isNaN(seconds) ? 0 : seconds,
      };
    });
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

  public async getHotFiles(
    userId: TypeId<'users'>,
    query: GetAnalyticsRangeRequestDto = {},
  ): Promise<GetAnalyticsHotFilesResponseDto> {
    const conditions = ['ws.user_id = $1'];
    const params: Array<string> = [userId];

    const addCondition = (column: string, operator: string, value: string): void => {
      params.push(value);
      conditions.push(`${column} ${operator} $${String(params.length)}`);
    };

    if (query.projectId) addCondition('ws.project_id', '=', query.projectId);
    if (query.startDate) addCondition('ws.started_at', '>=', query.startDate);
    if (query.endDate) addCondition('ws.started_at', '<=', query.endDate);

    const rows = await this.sessionRepo.manager.query<Array<FileActivityRow>>(
      `
      SELECT file.key AS path,
             SUM((file.value)::int) AS "totalSeconds"
      FROM work_sessions ws,
           LATERAL jsonb_each_text(COALESCE(ws.file_seconds, '{}'::jsonb)) AS file(key, value)
      WHERE ${conditions.join(' AND ')}
      GROUP BY file.key
      ORDER BY "totalSeconds" DESC
      `,
      params,
    );

    const files = rows
      .map((row) => ({ path: row.path, activeSeconds: Number.parseInt(row.totalSeconds, 10) }))
      .filter((row) => !Number.isNaN(row.activeSeconds) && row.activeSeconds > 0);
    const totalAttributedSeconds = files.reduce((sum, file) => sum + file.activeSeconds, 0);
    const folderSeconds = new Map<string, number>();

    for (const file of files) {
      const folder = path.posix.dirname(file.path);
      folderSeconds.set(folder, (folderSeconds.get(folder) ?? 0) + file.activeSeconds);
    }

    const toMetric = ({
      path: metricPath,
      activeSeconds,
    }: {
      path: string;
      activeSeconds: number;
    }): HotPathMetric => ({
      path: metricPath,
      activeSeconds,
      percentage: Number(
        ((totalAttributedSeconds > 0 ? activeSeconds / totalAttributedSeconds : 0) * 100).toFixed(
          1,
        ),
      ),
    });

    const folders = Array.from(folderSeconds, ([folderPath, activeSeconds]) => ({
      path: folderPath,
      activeSeconds,
    })).sort((first, second) => second.activeSeconds - first.activeSeconds);

    return {
      totalAttributedSeconds,
      files: files.slice(0, HOT_PATHS_LIMIT).map((file) => toMetric(file)),
      folders: folders.slice(0, HOT_PATHS_LIMIT).map((folder) => toMetric(folder)),
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

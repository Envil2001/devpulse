import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { startOfDay } from 'date-fns';
import { toDate, toZonedTime } from 'date-fns-tz';
import { Repository } from 'typeorm';

import { type TypeId } from '@devpulse/lib';

import { WorkSession, WorkSessionStatus } from '../../telemetry/entities/work-session.entity';
import { User } from '../../users/entities/user.entity';
import { GetIntegrationLanguagesResponseDto } from '../dto/response/get-integration-languages-response.dto';
import { GetIntegrationSessionItemDto } from '../dto/response/get-integration-sessions-response.dto';
import { GetIntegrationStatusResponseDto } from '../dto/response/get-integration-status-response.dto';
import { GetIntegrationTodayResponseDto } from '../dto/response/get-integration-today-response.dto';

const LIVE_SESSION_TIMEOUT_MS = 5 * 60 * 1000;

@Injectable()
export class IntegrationsAnalyticsService {
  constructor(
    @InjectRepository(WorkSession)
    private readonly sessionRepo: Repository<WorkSession>,
  ) {}

  public async getTodaySummary(user: User): Promise<GetIntegrationTodayResponseDto> {
    const userTimezone = user.timezone;
    const now = new Date();

    const userNow = toZonedTime(now, userTimezone);
    const userStartOfDay = startOfDay(userNow);
    const startOfDayUTC = toDate(userStartOfDay, { timeZone: userTimezone });

    const sessions = await this.sessionRepo
      .createQueryBuilder('session')
      .where('session.user_id = :userId', { userId: user.id })
      .andWhere('session.started_at >= :startOfDay', { startOfDay: startOfDayUTC })
      .getMany();

    const totalActiveSeconds = sessions.reduce((acc, s) => acc + s.activeSeconds, 0);

    const totalEarned = sessions.reduce((acc, s) => acc + (s.earnedMoney || 0), 0);
    const avgFocusScore =
      sessions.length > 0
        ? sessions.reduce((acc, s) => acc + s.focusScore, 0) / sessions.length
        : 0;

    return {
      date: startOfDayUTC.toISOString().slice(0, 10),
      timezone: userTimezone,
      currency: user.currency,
      totalActiveSeconds,
      formattedTime: this.formatSeconds(totalActiveSeconds),
      totalEarnedMoney: totalEarned,
      averageFocusScore: Math.round(avgFocusScore),
      sessionsCount: sessions.length,
    };
  }

  public async getRecentSessions(
    userId: TypeId<'users'>,
    limit: number,
  ): Promise<Array<GetIntegrationSessionItemDto>> {
    const sessions = await this.sessionRepo.find({
      where: { userId },
      relations: ['project'],
      order: { startedAt: 'DESC' },
      take: limit,
    });

    return sessions.map((s) => ({
      id: s.id,
      projectName: s.project?.name ?? 'Unknown',
      gitBranch: s.gitBranch,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      durationSeconds: s.activeSeconds,
      focusScore: s.focusScore,
      earnedMoney: s.earnedMoney,
    }));
  }

  public async getLiveStatus(userId: TypeId<'users'>): Promise<GetIntegrationStatusResponseDto> {
    const activeSession = await this.sessionRepo.findOne({
      where: {
        userId,
        status: WorkSessionStatus.ACTIVE,
      },
      relations: ['project'],
      order: { startedAt: 'DESC' },
    });

    if (!activeSession) {
      return {
        isCodingNow: false,
        currentProject: null,
        currentBranch: null,
        currentLanguage: null,
        currentSessionDurationSeconds: null,
        sessionStartedAt: null,
      };
    }

    const lastSeenMs = new Date(activeSession.endedAt ?? activeSession.startedAt).getTime();
    const isStale = Date.now() - lastSeenMs > LIVE_SESSION_TIMEOUT_MS;

    if (isStale) {
      return {
        isCodingNow: false,
        currentProject: null,
        currentBranch: null,
        currentLanguage: null,
        currentSessionDurationSeconds: null,
        sessionStartedAt: null,
      };
    }

    return {
      isCodingNow: true,
      currentProject: activeSession.project?.name ?? null,
      currentBranch: activeSession.gitBranch,
      currentLanguage: activeSession.primaryLanguage,
      currentSessionDurationSeconds: activeSession.activeSeconds,
      sessionStartedAt: activeSession.startedAt,
    };
  }

  public async getLanguagesBreakdown(
    userId: TypeId<'users'>,
  ): Promise<GetIntegrationLanguagesResponseDto> {
    const rawStats: Array<{ language: string; totalSeconds: string }> =
      await this.sessionRepo.query(
        `
        SELECT lang.key AS language,
               SUM((lang.value)::int) AS "totalSeconds"
        FROM work_sessions ws,
             LATERAL jsonb_each_text(
               CASE
                 WHEN ws.language_seconds = '{}'::jsonb
                   THEN jsonb_build_object(
                     COALESCE(ws.primary_language, 'Other'),
                     ws.active_seconds
                   )
                 ELSE ws.language_seconds
               END
             ) AS lang(key, value)
        WHERE ws.user_id = $1
        GROUP BY lang.key
        ORDER BY "totalSeconds" DESC
      `,
        [userId],
      );

    let totalActiveSeconds = 0;

    const parsedStats = rawStats.map((row) => {
      const seconds = Number.parseInt(row.totalSeconds, 10) || 0;
      totalActiveSeconds += seconds;
      return { language: row.language, seconds };
    });

    const languages = parsedStats.map(({ language, seconds }) => {
      const percentage = totalActiveSeconds > 0 ? (seconds / totalActiveSeconds) * 100 : 0;
      return {
        language,
        activeSeconds: seconds,
        formattedTime: this.formatSeconds(seconds),
        percentage: Number(percentage.toFixed(1)),
      };
    });

    return {
      totalActiveSeconds,
      languages,
    };
  }

  private formatSeconds(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) return `${h.toString()}h ${m.toString()}m`;
    if (m > 0) return `${m.toString()}m`;
    return `${s.toString()}s`;
  }
}

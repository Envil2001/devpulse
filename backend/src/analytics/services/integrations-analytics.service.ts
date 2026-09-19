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
    const totalEarned = sessions.reduce((acc, s) => acc + s.earnedMoney, 0);
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
    const sessions = await this.sessionRepo.find({
      where: { userId },
    });

    const languageMap = new Map<string, number>();
    let totalSeconds = 0;

    for (const s of sessions) {
      const lang = s.primaryLanguage ?? 'Other';
      const current = languageMap.get(lang) ?? 0;
      languageMap.set(lang, current + s.activeSeconds);
      totalSeconds += s.activeSeconds;
    }

    const languages = [...languageMap.entries()]
      .map(([language, activeSeconds]) => {
        const percentage = totalSeconds > 0 ? (activeSeconds / totalSeconds) * 100 : 0;
        return {
          language,
          activeSeconds,
          formattedTime: this.formatSeconds(activeSeconds),
          percentage: Number(percentage.toFixed(1)),
        };
      })
      .sort((a, b) => b.activeSeconds - a.activeSeconds);

    return {
      totalActiveSeconds: totalSeconds,
      languages,
    };
  }

  private formatSeconds(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h.toString()}h ${m.toString()}m`;
  }
}

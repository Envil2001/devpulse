import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';

import { WorkSession } from '../../telemetry/entities/work-session.entity';
import { User } from '../../users/entities/user.entity';
import {
  AI_SUMMARY_GENERATOR,
  type AiSummaryGenerator,
} from '../interfaces/ai-summary-generator.interface';

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
    const startDate = new Date(`${startDateStr}T00:00:00Z`);
    const endDate = new Date(`${endDateStr}T23:59:59Z`);

    const sessions = await this.workSessionRepo.find({
      where: {
        userId: user.id,
        startedAt: Between(startDate, endDate),
      },
      relations: ['project'],
    });

    if (sessions.length === 0) {
      throw new NotFoundException(
        'No coding activity found for the selected period. Please select a date range with recorded work sessions.',
      );
    }

    let totalActiveSeconds = 0;
    let weightedFocusScore = 0;
    const branches = new Set<string>();
    const projectsMap = new Map<string, number>();
    const languagesMap = new Map<string, number>();

    for (const session of sessions) {
      const active = session.activeSeconds;
      totalActiveSeconds += active;

      weightedFocusScore += session.focusScore * active;

      if (session.gitBranch) {
        branches.add(session.gitBranch);
      }

      if (session.project?.name) {
        projectsMap.set(
          session.project.name,
          (projectsMap.get(session.project.name) ?? 0) + active,
        );
      }

      if (session.primaryLanguage) {
        languagesMap.set(
          session.primaryLanguage,
          (languagesMap.get(session.primaryLanguage) ?? 0) + active,
        );
      }
    }

    const avgFocusScore =
      totalActiveSeconds > 0 ? Math.round(weightedFocusScore / totalActiveSeconds) : 0;

    const totalTimeStr = this.formatSeconds(totalActiveSeconds);

    const projectsStr =
      [...projectsMap.entries()]
        .map(([name, sec]) => `${name} (${this.formatSeconds(sec)})`)
        .join(', ') || 'No project';

    const languagesStr =
      [...languagesMap.entries()]
        .map(([lang, sec]) => `${lang} ${Math.round((sec / totalActiveSeconds) * 100).toString()}%`)
        .join(', ') || 'Not defined';

    const summaryText = await this.aiSummaryGenerator.generate({
      apiKey: user.openaiKey,
      date: `${startDateStr} to ${endDateStr}`,
      totalTime: totalTimeStr,
      projects: projectsStr,
      branches: [...branches].join(', ') || 'Unknown branch',
      languages: languagesStr,
      focusScore: avgFocusScore,
    });

    return {
      date: `${startDateStr} to ${endDateStr}`,
      summary: summaryText,
    };
  }

  private formatSeconds(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours.toString()}h ${minutes.toString()}m`;
    return `${minutes.toString()}m`;
  }
}

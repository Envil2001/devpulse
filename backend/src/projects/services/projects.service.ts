import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { formatDuration, TypeId } from '@devpulse/lib';

import { WorkSession, WorkSessionStatus } from '../../telemetry/entities/work-session.entity';
import {
  ProjectBranchDto,
  ProjectLanguageDto,
  ProjectRecentSessionDto,
  ProjectSummaryDto,
} from '../dto/response/project-summary.dto';
import { Project } from '../entities/project.entity';
import { RawProjectQueryResult } from '../interfaces/projects-internal.interfaces';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(WorkSession)
    private readonly sessionRepo: Repository<WorkSession>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  public async getUserProjects(userId: TypeId<'users'>): Promise<Array<ProjectSummaryDto>> {
    const rawProjects = await this.projectRepo
      .createQueryBuilder('project')
      .leftJoin('project.workSessions', 'session')
      .select('project.id', 'id')
      .addSelect('project.name', 'name')
      .addSelect('project.git_remote_url', 'remote')
      .addSelect('COALESCE(SUM(session.active_seconds), 0)', 'activeSeconds')
      .addSelect(
        'COALESCE(SUM(session.focus_score * session.active_seconds) / NULLIF(SUM(session.active_seconds), 0), 0)',
        'avgFocus',
      )
      .addSelect('COUNT(session.id)', 'sessionsCount')
      .addSelect('MAX(COALESCE(session.ended_at, session.started_at))', 'lastActive')
      .where('project.user_id = :userId', { userId })
      .groupBy('project.id')
      .addGroupBy('project.name')
      .addGroupBy('project.git_remote_url')
      .orderBy('MAX(COALESCE(session.ended_at, session.started_at))', 'DESC', 'NULLS LAST')
      .getRawMany<RawProjectQueryResult>();

    return rawProjects.map((p) => {
      const activeSeconds = Number(p.activeSeconds);
      const lastActiveIso = p.lastActive ? new Date(p.lastActive).toISOString() : null;

      return {
        id: p.id,
        name: p.name,
        remote: p.remote,
        activeTime: formatDuration(activeSeconds),
        focusScore: Math.round(Number(p.avgFocus)),
        sessions: Number(p.sessionsCount),
        lastActive: lastActiveIso,
        totalCommits: 0,
        totalCommands: 0,
        languages: [],
        branches: [],
        recentSessions: [],
      };
    });
  }

  public async getProjectById(
    userId: TypeId<'users'>,
    projectId: TypeId<'projects'>,
  ): Promise<ProjectSummaryDto> {
    const rawProject = await this.projectRepo
      .createQueryBuilder('project')
      .leftJoin('project.workSessions', 'session')
      .select('project.id', 'id')
      .addSelect('project.name', 'name')
      .addSelect('project.git_remote_url', 'remote')
      .addSelect('COALESCE(SUM(session.active_seconds), 0)', 'activeSeconds')
      .addSelect(
        'COALESCE(SUM(session.focus_score * session.active_seconds) / NULLIF(SUM(session.active_seconds), 0), 0)',
        'avgFocus',
      )
      .addSelect('COUNT(session.id)', 'sessionsCount')
      .addSelect('MAX(COALESCE(session.ended_at, session.started_at))', 'lastActive')
      .where('project.id = :projectId AND project.user_id = :userId', { projectId, userId })
      .groupBy('project.id')
      .addGroupBy('project.name')
      .addGroupBy('project.git_remote_url')
      .getRawOne<RawProjectQueryResult>();

    if (!rawProject) {
      throw new NotFoundException('Project not found');
    }

    const sessions = await this.sessionRepo.find({
      where: {
        projectId: rawProject.id,
        userId,
        status: WorkSessionStatus.CLOSED,
      },
      order: { startedAt: 'DESC' },
    });

    const activeSeconds = Number(rawProject.activeSeconds);
    const { totalCommits, totalCommands, languages, branches } =
      this.aggregateSessionDetails(sessions);

    const recentSessions = sessions.slice(0, 5).map((s): ProjectRecentSessionDto => ({
      id: s.id,
      startedAt: s.startedAt.toISOString(),
      durationSeconds: s.activeSeconds,
      gitBranch: s.gitBranch,
      primaryLanguage: s.primaryLanguage,
    }));

    return {
      id: rawProject.id,
      name: rawProject.name,
      remote: rawProject.remote,
      activeTime: formatDuration(activeSeconds),
      focusScore: Math.round(Number(rawProject.avgFocus)),
      sessions: Number(rawProject.sessionsCount),
      lastActive: rawProject.lastActive ? new Date(rawProject.lastActive).toISOString() : null,
      totalCommits,
      totalCommands,
      languages,
      branches,
      recentSessions,
    };
  }
  private aggregateSessionDetails(sessions: Array<WorkSession>): {
    totalCommits: number;
    totalCommands: number;
    languages: Array<ProjectLanguageDto>;
    branches: Array<ProjectBranchDto>;
  } {
    let totalActiveSeconds = 0;
    let totalCommits = 0;
    let totalCommands = 0;

    const langMap = new Map<string, number>();
    const branchMap = new Map<string, number>();

    for (const session of sessions) {
      totalActiveSeconds += session.activeSeconds;
      totalCommits += session.commitsCount;
      totalCommands += session.commandsRun;

      if (session.languageSeconds) {
        for (const [lang, sec] of Object.entries(session.languageSeconds)) {
          langMap.set(lang, (langMap.get(lang) ?? 0) + sec);
        }
      }

      if (session.gitBranch) {
        branchMap.set(
          session.gitBranch,
          (branchMap.get(session.gitBranch) ?? 0) + session.activeSeconds,
        );
      }
    }

    const languages: Array<ProjectLanguageDto> = [...langMap.entries()]
      .map(([name, seconds]) => ({
        name,
        seconds,
        percentage: totalActiveSeconds > 0 ? Math.round((seconds / totalActiveSeconds) * 100) : 0,
      }))
      .sort((a, b) => b.seconds - a.seconds);

    const branches: Array<ProjectBranchDto> = [...branchMap.entries()]
      .map(([name, seconds]) => ({ name, seconds }))
      .sort((a, b) => b.seconds - a.seconds);

    return { totalCommits, totalCommands, languages, branches };
  }
}

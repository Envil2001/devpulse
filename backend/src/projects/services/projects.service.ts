import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TypeId } from '@devpulse/lib';

import { WorkSession } from '../../telemetry/entities/work-session.entity';
import { Project } from '../entities/project.entity';
import { RawProjectQueryResult } from '../interfaces/projects-internal.interfaces';

export interface ProjectSummaryDto {
  id: string;
  name: string;
  remote: string | null;
  activeTime: string;
  focusScore: number;
  sessions: number;
  lastActive: string | null;
}

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
      const activeSeconds = Number(p.activeSeconds ?? 0);
      const lastActiveIso = p.lastActive ? new Date(p.lastActive).toISOString() : null;

      return {
        id: p.id ?? '',
        name: p.name ?? 'Untitled Project',
        remote: p.remote ?? null,
        activeTime: this.formatDuration(activeSeconds),
        focusScore: Math.round(Number(p.avgFocus ?? 0)),
        sessions: Number(p.sessionsCount ?? 0),
        lastActive: lastActiveIso,
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

    if (!rawProject?.id) {
      throw new NotFoundException('Project not found');
    }

    const activeSeconds = Number(rawProject.activeSeconds ?? 0);

    return {
      id: rawProject.id,
      name: rawProject.name ?? 'Untitled Project',
      remote: rawProject.remote ?? null,
      activeTime: this.formatDuration(activeSeconds),
      focusScore: Math.round(Number(rawProject.avgFocus ?? 0)),
      sessions: Number(rawProject.sessionsCount ?? 0),
      lastActive: rawProject.lastActive ? new Date(rawProject.lastActive).toISOString() : null,
    };
  }

  private formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const hoursStr = hours.toString();
    const minutesStr = minutes.toString();
    return hours > 0 ? `${hoursStr}h ${minutesStr}m` : `${minutesStr}m`;
  }
}

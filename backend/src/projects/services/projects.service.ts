import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TypeId } from '@devpulse/lib';

import { WorkSession } from '../../telemetry/entities/work-session.entity';
import { Project } from '../entities/project.entity';

export interface ProjectSummaryDto {
  id: string;
  name: string;
  remote: string | null;
  activeTime: string;
  focusScore: number;
  sessions: number;
  lastActive: string | null;
}

interface RawProjectQueryResult {
  id: string | null;
  name: string | null;
  remote: string | null;
  activeSeconds: string | number | null;
  avgFocus: string | number | null;
  sessionsCount: string | number | null;
  lastActive: Date | string | null;
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
    const rawProjects = await this.sessionRepo
      .createQueryBuilder('session')
      .leftJoin('session.project', 'project')
      .select('project.id', 'id')
      .addSelect('project.name', 'name')
      .addSelect('project.gitRemoteUrl', 'remote')
      .addSelect('SUM(session.activeSeconds)', 'activeSeconds')
      .addSelect('AVG(session.focusScore)', 'avgFocus')
      .addSelect('COUNT(session.id)', 'sessionsCount')
      .addSelect('MAX(session.endedAt)', 'lastActive')
      .where('session.userId = :userId', { userId })
      .groupBy('project.id')
      .addGroupBy('project.name')
      .addGroupBy('project.gitRemoteUrl')
      .getRawMany<RawProjectQueryResult>();

    return rawProjects.map((p, index): ProjectSummaryDto => {
      const activeSeconds = Number(p.activeSeconds ?? 0);
      const hours = Math.floor(activeSeconds / 3600);
      const minutes = Math.floor((activeSeconds % 3600) / 60);

      const hoursStr = hours.toString();
      const minutesStr = minutes.toString();

      let lastActiveIso: string | null = null;
      if (p.lastActive) {
        lastActiveIso = new Date(p.lastActive).toISOString();
      }

      return {
        id: p.id ?? String(index + 1),
        name: p.name ?? 'Unassigned Project',
        remote: p.remote ?? null,
        activeTime: hours > 0 ? `${hoursStr}h ${minutesStr}m` : `${minutesStr}m`,
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
    const project = await this.projectRepo.findOne({ where: { id: projectId, userId } });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const rawProject = await this.sessionRepo
      .createQueryBuilder('session')
      .select('SUM(session.activeSeconds)', 'activeSeconds')
      .addSelect('AVG(session.focusScore)', 'avgFocus')
      .addSelect('COUNT(session.id)', 'sessionsCount')
      .addSelect('MAX(session.endedAt)', 'lastActive')
      .where('session.userId = :userId', { userId })
      .andWhere('session.projectId = :projectId', { projectId })
      .getRawOne<RawProjectQueryResult>();

    const activeSeconds = Number(rawProject?.activeSeconds ?? 0);
    const hours = Math.floor(activeSeconds / 3600);
    const minutes = Math.floor((activeSeconds % 3600) / 60);
    const hoursStr = hours.toString();
    const minutesStr = minutes.toString();
    return {
      id: project.id,
      name: project.name,
      remote: project.gitRemoteUrl,
      activeTime: hours > 0 ? `${hoursStr}h ${minutesStr}m` : `${minutesStr}m`,
      focusScore: Math.round(Number(rawProject?.avgFocus ?? 0)),
      sessions: Number(rawProject?.sessionsCount ?? 0),
      lastActive: rawProject?.lastActive ? new Date(rawProject.lastActive).toISOString() : null,
    };
  }
}

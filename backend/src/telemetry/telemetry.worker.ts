import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';
import { Worker, Job } from 'bullmq';

import { TelemetryJobData } from './queue/telemetry.queue';
import { RedisService } from '../redis/services/redis.service';
import { WorkSession, WorkSessionStatus } from './entities/work-session.entity';
import { Project } from '../projects/entities/project.entity';
import { UserRepository } from '../users/repositories/users.repository';
import { TelemetryEventItemDto } from './dto/request/ingest-telemetry-batch-request.dto';
import { User } from '../users/entities/user.entity';
import { TelemetryEvent } from './entities/telemetry-event.entity';

@Injectable()
export class TelemetryWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelemetryWorker.name);
  private worker!: Worker<TelemetryJobData>;

  constructor(
    private readonly redisService: RedisService,
    private readonly userRepository: UserRepository,
    private readonly dataSource: DataSource,
    @InjectRepository(WorkSession)
    private readonly sessionRepo: Repository<WorkSession>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(TelemetryEvent)
    private readonly telemetryEventRepo: Repository<TelemetryEvent>,
  ) {}

  public async onModuleInit(): Promise<void> {
    this.worker = new Worker<TelemetryJobData>(
      'telemetry-ingestion',
      async (job: Job<TelemetryJobData>) => {
        await this.processTelemetryBatch(job.data);
      },
      {
        connection: this.redisService.getClient(),
        concurrency: 5,
      },
    );
  }

  public async onModuleDestroy(): Promise<void> {
    await this.worker.close();
  }

  private async processTelemetryBatch(data: TelemetryJobData): Promise<void> {
    const { userId, events } = data;
    const user = await this.userRepository.findById(userId);

    if (!user) {
      this.logger.error(`User ${userId} not found.`);
      return;
    }

    for (const event of events) {
      await this.dataSource.transaction(async (manager: EntityManager) => {
        await this.processEvent(manager, user, event);
      });
    }
  }

  private async processEvent(
    manager: EntityManager,
    user: User,
    event: TelemetryEventItemDto,
  ): Promise<void> {
    const sessionRepo = manager.getRepository(WorkSession);
    const projectRepo = manager.getRepository(Project);
    const telemetryEventRepo = manager.getRepository(TelemetryEvent);

    let project: Project | null = null;
    if (event.gitRemoteUrl) {
      project = await projectRepo.findOneBy({ gitRemoteUrl: event.gitRemoteUrl });
      if (!project) {
        project = projectRepo.create({
          gitRemoteUrl: event.gitRemoteUrl,
          name: event.gitRemoteUrl.split('/').pop()?.replace('.git', '') || 'Unknown',
        });
        project = await projectRepo.save(project);
      }
    }

    const eventTime = new Date(event.timestamp);

    const lastSession = await sessionRepo.findOne({
      where: {
        userId: user.id,
        gitBranch: event.branch,
        status: WorkSessionStatus.ACTIVE,
      },
      order: { endedAt: 'DESC' },
    });

    const isContinuation =
      lastSession &&
      lastSession.endedAt &&
      eventTime.getTime() - lastSession.endedAt.getTime() <= 5 * 60 * 1000;

    let currentSession: WorkSession;

    if (isContinuation) {
      lastSession.endedAt = eventTime;
      lastSession.activeSeconds += event.activeSeconds;
      lastSession.idleSeconds += event.idleSeconds;

      const total = lastSession.activeSeconds + lastSession.idleSeconds;
      lastSession.focusScore = total > 0 ? (lastSession.activeSeconds / total) * 100 : 0;

      currentSession = await sessionRepo.save(lastSession);
    } else {
      const total = event.activeSeconds + event.idleSeconds;
      const focusScore = total > 0 ? (event.activeSeconds / total) * 100 : 0;

      const newSession = sessionRepo.create({
        user: user,
        userId: user.id,
        project: project || null,
        projectId: project?.id || null,
        gitBranch: event.branch,
        startedAt: eventTime,
        endedAt: eventTime,
        activeSeconds: event.activeSeconds,
        idleSeconds: event.idleSeconds,
        focusScore,
        earnedMoney: 0,
        status: WorkSessionStatus.ACTIVE,
      });

      currentSession = await sessionRepo.save(newSession);
    }

    const rawEvent = telemetryEventRepo.create({
      user: user,
      project: project || null,
      session: currentSession,
      gitBranch: event.branch,
      eventTimestamp: eventTime,
      activeSeconds: event.activeSeconds,
      idleSeconds: event.idleSeconds,
      filesChanged: event.filesChanged,
      fileExtensions: event.fileExtensions,
    });

    await telemetryEventRepo.save(rawEvent);
  }
}

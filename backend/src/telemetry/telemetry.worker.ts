import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Worker } from 'bullmq';
import Redis from 'ioredis/built/Redis';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { Project } from '../projects/entities/project.entity';
import { BULL_REDIS_CLIENT } from '../redis/redis.module';
import { User } from '../users/entities/user.entity';
import { UserRepository } from '../users/repositories/users.repository';

import { TelemetryEventItemDto } from './dto/request/ingest-telemetry-batch-request.dto';
import { TelemetryEvent } from './entities/telemetry-event.entity';
import { WorkSession, WorkSessionStatus } from './entities/work-session.entity';
import { TelemetryJobData } from './queue/telemetry.queue';

@Injectable()
export class TelemetryWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelemetryWorker.name);
  private worker!: Worker<TelemetryJobData>;

  constructor(
    @Inject(BULL_REDIS_CLIENT)
    private readonly redisConnection: Redis,
    private readonly userRepository: UserRepository,
    private readonly dataSource: DataSource,
    @InjectRepository(WorkSession)
    private readonly sessionRepo: Repository<WorkSession>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(TelemetryEvent)
    private readonly telemetryEventRepo: Repository<TelemetryEvent>,
  ) {}

  public onModuleInit(): void {
    this.worker = new Worker<TelemetryJobData>(
      'telemetry-ingestion',
      async (job: Job<TelemetryJobData>) => {
        await this.processTelemetryBatch(job.data);
      },
      {
        connection: this.redisConnection,
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
          name: event.gitRemoteUrl.split('/').pop()?.replace('.git', '') ?? 'Unknown',
        });
        project = await projectRepo.save(project);
      }
    }

    const eventTime = new Date(event.clientTimestamp ?? new Date().toISOString());

    const lastSession = await sessionRepo.findOne({
      where: {
        userId: user.id,
        gitBranch: event.gitBranch || 'no-branch',
        status: WorkSessionStatus.ACTIVE,
      },
      order: { endedAt: 'DESC' },
    });

    const isContinuation =
      lastSession?.endedAt && eventTime.getTime() - lastSession.endedAt.getTime() <= 5 * 60 * 1000;

    const durationSec = event.durationMs ? Math.round(event.durationMs / 1000) : 0;
    const activeSeconds = event.type === 'idle_start' ? durationSec : 0;
    const idleSeconds = event.type === 'idle_end' ? durationSec : 0;

    let currentSession: WorkSession;

    if (isContinuation) {
      lastSession.endedAt = eventTime;
      lastSession.activeSeconds += activeSeconds;
      lastSession.idleSeconds += idleSeconds;

      const total = lastSession.activeSeconds + lastSession.idleSeconds;
      lastSession.focusScore = total > 0 ? (lastSession.activeSeconds / total) * 100 : 0;

      if (event.language) {
        lastSession.primaryLanguage = event.language;
      }

      currentSession = await sessionRepo.save(lastSession);
    } else {
      const total = activeSeconds + idleSeconds;
      const focusScore = total > 0 ? (activeSeconds / total) * 100 : 0;

      const newSession = sessionRepo.create({
        user: user,
        userId: user.id,
        project: project ?? null,
        projectId: project?.id ?? null,
        gitBranch: event.gitBranch,
        startedAt: eventTime,
        endedAt: eventTime,
        activeSeconds,
        idleSeconds,
        focusScore,
        earnedMoney: 0,
        primaryLanguage: event.language ?? null,
        status: WorkSessionStatus.ACTIVE,
      });

      currentSession = await sessionRepo.save(newSession);
    }

    const filesChanged = event.filePath ? [event.filePath] : [];
    const fileExtensions = event.language ? [event.language] : [];

    const rawEvent = telemetryEventRepo.create({
      user: user,
      project: project ?? null,
      session: currentSession,
      gitBranch: event.gitBranch,
      eventTimestamp: eventTime,
      activeSeconds,
      idleSeconds,
      filesChanged,
      fileExtensions,
    });

    await telemetryEventRepo.save(rawEvent);
  }
}

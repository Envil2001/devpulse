import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import Redis from 'ioredis/built/Redis';
import { DataSource, EntityManager } from 'typeorm';

import { typeIdGenerator } from '@devpulse/lib';

import { Project } from '../projects/entities/project.entity';
import { BULL_REDIS_CLIENT } from '../redis/redis.module';
import { User } from '../users/entities/user.entity';
import { UserRepository } from '../users/repositories/users.repository';

import { TelemetryEventItemDto } from './dto/request/ingest-telemetry-batch-request.dto';
import { TelemetryEvent } from './entities/telemetry-event.entity';
import { WorkSession, WorkSessionStatus } from './entities/work-session.entity';
import { TelemetryJobData } from './queue/telemetry.queue';

const SESSION_GAP_MS = 15 * 60 * 1000;
const MAX_IDLE_CREDIT_MS = 30 * 60 * 1000;

@Injectable()
export class TelemetryWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelemetryWorker.name);
  private worker!: Worker<TelemetryJobData>;

  constructor(
    @Inject(BULL_REDIS_CLIENT)
    private readonly redisConnection: Redis,
    private readonly userRepository: UserRepository,
    private readonly dataSource: DataSource,
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

    this.worker.on('completed', (job) => {
      const jobId = job.id ?? 'unknown';
      const eventsCount = String(job.data.events.length);
      this.logger.log(`Job ${jobId} successfully processed ${eventsCount} events.`);
    });

    this.worker.on('failed', (job, err) => {
      const jobId = job?.id ?? 'unknown';
      const userId = job?.data.userId ?? 'unknown';
      this.logger.error(
        `Job ${jobId} FAILED processing telemetry for user ${userId}. Error: ${err.message}`,
        err.stack,
      );
    });

    this.worker.on('error', (err) => {
      this.logger.error(`Worker System Error: ${err.message}`, err.stack);
    });
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
      project = await projectRepo.findOneBy({
        gitRemoteUrl: event.gitRemoteUrl,
        userId: user.id,
      });

      if (!project) {
        project = projectRepo.create({
          gitRemoteUrl: event.gitRemoteUrl,
          name: event.gitRemoteUrl.split('/').pop()?.replace('.git', '') ?? 'Unknown',
          user,
          userId: user.id,
        });
        project.id = typeIdGenerator('projects');
        project = await projectRepo.save(project);
      }
    }

    const eventTime = new Date(event.clientTimestamp ?? new Date().toISOString());

    const idleCreditSec =
      event.type === 'idle_end' && event.durationMs
        ? Math.min(Math.round(event.durationMs / 1000), Math.round(MAX_IDLE_CREDIT_MS / 1000))
        : 0;

    const lastSession = await sessionRepo.findOne({
      where: {
        userId: user.id,
        gitBranch: event.gitBranch,
        status: WorkSessionStatus.ACTIVE,
      },
      order: { endedAt: 'DESC' },
    });

    const gapMs = lastSession?.endedAt
      ? eventTime.getTime() - lastSession.endedAt.getTime()
      : Number.POSITIVE_INFINITY;

    const isContinuation = lastSession !== null && gapMs >= 0 && gapMs <= SESSION_GAP_MS;

    let currentSession: WorkSession;

    if (isContinuation) {
      lastSession.endedAt = eventTime;
      lastSession.idleSeconds += idleCreditSec;

      this.recomputeDerived(lastSession, user);

      if (event.language) {
        lastSession.primaryLanguage = event.language;
      }

      currentSession = await sessionRepo.save(lastSession);
    } else {
      if (lastSession) {
        lastSession.status = WorkSessionStatus.CLOSED;
        this.recomputeDerived(lastSession, user);
        await sessionRepo.save(lastSession);
      }

      const newSession = sessionRepo.create({
        user: user,
        userId: user.id,
        project: project ?? null,
        projectId: project?.id ?? null,
        gitBranch: event.gitBranch,
        startedAt: eventTime,
        endedAt: eventTime,
        activeSeconds: 0,
        idleSeconds: idleCreditSec,
        focusScore: 0,
        earnedMoney: 0,
        primaryLanguage: event.language ?? null,
        status: WorkSessionStatus.ACTIVE,
      });
      newSession.id = typeIdGenerator('workSessions');

      this.recomputeDerived(newSession, user);

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
      activeSeconds: 0,
      idleSeconds: idleCreditSec,
      filesChanged,
      fileExtensions,
    });
    rawEvent.id = typeIdGenerator('telemetryEvents');
    await telemetryEventRepo.save(rawEvent);
  }

  private recomputeDerived(session: WorkSession, user: User): void {
    const endedAt = session.endedAt ?? session.startedAt;
    const wallSec = Math.max(
      0,
      Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000),
    );

    session.activeSeconds = Math.max(0, wallSec - session.idleSeconds);

    const total = session.activeSeconds + session.idleSeconds;
    session.focusScore = total > 0 ? (session.activeSeconds / total) * 100 : 0;
    session.earnedMoney = (session.activeSeconds / 3600) * user.hourlyRate;
  }
}

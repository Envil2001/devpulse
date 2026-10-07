import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Job, Worker } from 'bullmq';
import Redis from 'ioredis/built/Redis';
import { DataSource, EntityManager, Repository } from 'typeorm';

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

const MAX_LANGUAGE_DELTA_SEC = 300;

const NOISY_LANGUAGES = new Set(['plaintext', 'log', 'jsonc']);

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
    const project = await this.resolveProject(manager, user, event.gitRemoteUrl);
    const eventTime = new Date(event.clientTimestamp ?? new Date().toISOString());

    if (event.type === 'session_end') {
      const active = await sessionRepo.findOne({
        where: {
          userId: user.id,
          gitBranch: event.gitBranch,
          status: WorkSessionStatus.ACTIVE,
        },
        order: { endedAt: 'DESC' },
      });

      if (active) {
        this.accumulateLanguage(active, eventTime);
        active.endedAt = eventTime;
        active.status = WorkSessionStatus.CLOSED;
        this.recomputeDerived(active, user);
        await sessionRepo.save(active);
      }

      await this.persistRawEvent(manager, user, project, active ?? null, event, eventTime, 0);
      return;
    }

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

    const idleCreditSec = this.getIdleCreditSeconds(event);

    let currentSession: WorkSession;

    if (lastSession !== null && gapMs >= 0 && gapMs <= SESSION_GAP_MS) {
      this.accumulateLanguage(lastSession, eventTime);
      this.applyEventLanguage(lastSession, event);

      lastSession.endedAt = eventTime;
      lastSession.idleSeconds += idleCreditSec;

      this.recomputeDerived(lastSession, user);

      currentSession = await sessionRepo.save(lastSession);
    } else {
      await this.closeAllActiveSessions(sessionRepo, user);

      const newSession = sessionRepo.create({
        user: user,
        userId: user.id,
        project: project ?? null,
        projectId: project?.id ?? null,
        gitBranch: event.gitBranch,
        startedAt: eventTime,
        endedAt: eventTime,
        activeSeconds: 0,
        idleSeconds: 0,
        focusScore: 0,
        earnedMoney: 0,
        primaryLanguage: null,
        currentLanguage: null,
        languageSeconds: {},
        status: WorkSessionStatus.ACTIVE,
      });
      newSession.id = typeIdGenerator('workSessions');

      this.applyEventLanguage(newSession, event);
      this.recomputeDerived(newSession, user);

      currentSession = await sessionRepo.save(newSession);
    }

    await this.persistRawEvent(
      manager,
      user,
      project,
      currentSession,
      event,
      eventTime,
      idleCreditSec,
    );
  }

  private async resolveProject(
    manager: EntityManager,
    user: User,
    gitRemoteUrl: string | undefined,
  ): Promise<Project | null> {
    if (!gitRemoteUrl) return null;

    const projectRepo = manager.getRepository(Project);

    let project = await projectRepo.findOneBy({
      gitRemoteUrl,
      userId: user.id,
    });

    if (!project) {
      project = projectRepo.create({
        gitRemoteUrl,
        name: gitRemoteUrl.split('/').pop()?.replace('.git', '') ?? 'Unknown',
        user,
        userId: user.id,
      });
      project.id = typeIdGenerator('projects');
      project = await projectRepo.save(project);
    }

    return project;
  }

  private async closeAllActiveSessions(
    sessionRepo: Repository<WorkSession>,
    user: User,
  ): Promise<void> {
    const actives = await sessionRepo.find({
      where: {
        userId: user.id,
        status: WorkSessionStatus.ACTIVE,
      },
    });

    for (const active of actives) {
      active.status = WorkSessionStatus.CLOSED;
      this.recomputeDerived(active, user);
      await sessionRepo.save(active);
    }
  }

  private accumulateLanguage(session: WorkSession, eventTime: Date): void {
    const lastAt = session.endedAt?.getTime() ?? session.startedAt.getTime();
    const deltaSec = Math.round((eventTime.getTime() - lastAt) / 1000);

    if (deltaSec <= 0) return;
    if (!session.currentLanguage) return;

    const capped = Math.min(deltaSec, MAX_LANGUAGE_DELTA_SEC);
    const buckets: Record<string, number> = { ...session.languageSeconds };
    buckets[session.currentLanguage] = (buckets[session.currentLanguage] ?? 0) + capped;
    session.languageSeconds = buckets;
  }

  private applyEventLanguage(session: WorkSession, event: TelemetryEventItemDto): void {
    if (!event.language) return;

    const lang = event.language.toLowerCase();
    if (NOISY_LANGUAGES.has(lang)) return;

    session.currentLanguage = lang;
  }

  private topLanguage(buckets: Record<string, number> | null | undefined): string | null {
    if (!buckets) return null;

    let best: string | null = null;
    let bestSec = 0;

    for (const [lang, sec] of Object.entries(buckets)) {
      if (sec > bestSec) {
        best = lang;
        bestSec = sec;
      }
    }

    return best;
  }

  private getIdleCreditSeconds(event: TelemetryEventItemDto): number {
    if (event.type !== 'idle_end' || !event.durationMs) return 0;

    const rawSec = Math.round(event.durationMs / 1000);
    const capSec = Math.round(MAX_IDLE_CREDIT_MS / 1000);
    return Math.min(rawSec, capSec);
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

    session.primaryLanguage = this.topLanguage(session.languageSeconds);
  }

  private async persistRawEvent(
    manager: EntityManager,
    user: User,
    project: Project | null,
    session: WorkSession | null,
    event: TelemetryEventItemDto,
    eventTime: Date,
    idleCreditSec: number,
  ): Promise<void> {
    const repo = manager.getRepository(TelemetryEvent);

    const rawEvent = repo.create({
      user,
      project,
      session,
      gitBranch: event.gitBranch,
      eventTimestamp: eventTime,
      activeSeconds: 0,
      idleSeconds: idleCreditSec,
      filesChanged: event.filePath ? [event.filePath] : [],
      fileExtensions: event.language ? [event.language] : [],
    });
    rawEvent.id = typeIdGenerator('telemetryEvents');
    await repo.save(rawEvent);
  }
}

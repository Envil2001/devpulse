import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { IsNull, Repository } from 'typeorm';

import { TelemetryEvent, TelemetryEventType } from './entities/telemetry-event.entity';
import { WorkSession, WorkSessionStatus } from './entities/work-session.entity';
import { TelemetryIngestJob } from './telemetry.queue';

const QUEUE_NAME = 'telemetry-events';
const ONE_MINUTE_MS = 60_000;
const SESSION_GAP_MS = 5 * ONE_MINUTE_MS;

function resolveRedisHost(): string {
  const host = process.env.REDIS_HOST ?? 'localhost';
  return host === 'redis' ? 'localhost' : host;
}

function resolveRedisPort(): number {
  return Number(process.env.REDIS_PORT ?? 6379);
}

@Injectable()
export class TelemetryWorker implements OnModuleInit, OnModuleDestroy {
  private readonly connection = new IORedis({
    host: resolveRedisHost(),
    port: resolveRedisPort(),
    maxRetriesPerRequest: null,
  });

  private worker: Worker<TelemetryIngestJob> | undefined;

  constructor(
    @InjectRepository(TelemetryEvent)
    private readonly eventsRepository: Repository<TelemetryEvent>,
    @InjectRepository(WorkSession)
    private readonly sessionsRepository: Repository<WorkSession>,
  ) {}

  public onModuleInit(): void {
    this.worker = new Worker<TelemetryIngestJob>(
      QUEUE_NAME,
      async (job: Job<TelemetryIngestJob>) => this.process(job.data),
      {
        connection: this.connection,
        concurrency: 10,
      },
    );
  }

  private async process(payload: TelemetryIngestJob): Promise<void> {
    const now = new Date();

    const events = payload.events.map((e) =>
      this.eventsRepository.create({
        type: e.type,
        gitBranch: e.gitBranch ?? null,
        filePath: e.filePath ?? null,
        language: e.language ?? null,
        durationMs: e.durationMs ?? null,
        clientTimestamp: e.clientTimestamp ? new Date(e.clientTimestamp) : null,
        apiKeyId: payload.apiKeyId,
        userId: payload.userId,
        projectId: null,
        sessionId: null,
        createdAt: now,
      }),
    );

    await this.eventsRepository.save(events);
    await this.aggregateHeartbeatSessions(payload.userId);
  }

  private async aggregateHeartbeatSessions(userId: TelemetryEvent['userId']): Promise<void> {
    const pendingTicks = await this.eventsRepository.find({
      where: {
        userId,
        type: TelemetryEventType.HEARTBEAT,
        sessionId: IsNull(),
      },
      order: {
        clientTimestamp: 'ASC',
        createdAt: 'ASC',
      },
    });

    if (pendingTicks.length === 0) {
      return;
    }

    let state = await this.resolveInitialState(userId, pendingTicks[0]);

    for (const tick of pendingTicks) {
      const tickAt = this.resolveTickTime(tick);
      if (state === null || !this.canAppendTick(state, tick.gitBranch, tickAt)) {
        if (state !== null) {
          await this.persistSessionState(state, false);
        }
        state = this.buildNewSessionState(userId, tick.gitBranch, tickAt);
      }

      state.tickIds.push(tick.id);
      state.tickCount += 1;
      state.lastTickAt = tickAt;
      this.bumpLanguage(state, tick.language);
    }

    if (state !== null) {
      await this.persistSessionState(state, true);
    }
  }

  private async resolveInitialState(
    userId: TelemetryEvent['userId'],
    firstTick: TelemetryEvent,
  ): Promise<SessionAggregationState | null> {
    const latestSession = await this.sessionsRepository.findOne({
      where: { userId },
      order: { startedAt: 'DESC' },
    });

    if (latestSession === null) {
      return null;
    }

    const firstTickAt = this.resolveTickTime(firstTick);
    const canContinue = this.canContinueSession(latestSession, firstTick.gitBranch, firstTickAt);

    if (latestSession.status === WorkSessionStatus.ACTIVE && !canContinue) {
      latestSession.status = WorkSessionStatus.CLOSED;
      await this.sessionsRepository.save(latestSession);
      return null;
    }

    return canContinue ? this.buildStateFromExistingSession(latestSession) : null;
  }

  private resolveTickTime(event: TelemetryEvent): Date {
    return event.clientTimestamp ?? event.createdAt;
  }

  private canContinueSession(
    session: WorkSession,
    gitBranch: string | null,
    tickAt: Date,
  ): boolean {
    if (session.gitBranch !== gitBranch) {
      return false;
    }

    const sessionEnd = session.endedAt ?? session.startedAt;
    return tickAt.getTime() - sessionEnd.getTime() <= SESSION_GAP_MS;
  }

  private canAppendTick(
    state: SessionAggregationState,
    gitBranch: string | null,
    tickAt: Date,
  ): boolean {
    if (state.gitBranch !== gitBranch) {
      return false;
    }

    return tickAt.getTime() - state.lastTickAt.getTime() <= SESSION_GAP_MS;
  }

  private buildStateFromExistingSession(session: WorkSession): SessionAggregationState {
    const estimatedExistingTickCount = Math.max(
      0,
      Math.round(session.activeDurationMs / ONE_MINUTE_MS),
    );
    const languageCounts = new Map<string, number>();
    if (session.primaryLanguage !== null && estimatedExistingTickCount > 0) {
      languageCounts.set(session.primaryLanguage, estimatedExistingTickCount);
    }

    return {
      sessionId: session.id,
      userId: session.userId,
      gitBranch: session.gitBranch,
      startedAt: session.startedAt,
      lastTickAt: session.endedAt ?? session.startedAt,
      tickCount: estimatedExistingTickCount,
      languageCounts,
      tickIds: [],
    };
  }

  private buildNewSessionState(
    userId: TelemetryEvent['userId'],
    gitBranch: string | null,
    startedAt: Date,
  ): SessionAggregationState {
    return {
      sessionId: null,
      userId,
      gitBranch,
      startedAt,
      lastTickAt: startedAt,
      tickCount: 0,
      languageCounts: new Map<string, number>(),
      tickIds: [],
    };
  }

  private bumpLanguage(state: SessionAggregationState, language: string | null): void {
    if (language === null) {
      return;
    }
    const current = state.languageCounts.get(language) ?? 0;
    state.languageCounts.set(language, current + 1);
  }

  private pickPrimaryLanguage(languageCounts: Map<string, number>): string | null {
    let primary: string | null = null;
    let max = -1;
    for (const [language, count] of languageCounts.entries()) {
      if (count > max) {
        primary = language;
        max = count;
      }
    }
    return primary;
  }

  private async persistSessionState(
    state: SessionAggregationState,
    markActive: boolean,
  ): Promise<void> {
    const activeDurationMs = state.tickCount * ONE_MINUTE_MS;
    const totalDurationMs = Math.max(
      ONE_MINUTE_MS,
      state.lastTickAt.getTime() - state.startedAt.getTime() + ONE_MINUTE_MS,
    );

    const primaryLanguage = this.pickPrimaryLanguage(state.languageCounts);

    let sessionId: WorkSession['id'];

    if (state.sessionId === null) {
      const created = this.sessionsRepository.create({
        userId: state.userId,
        projectId: null,
        gitBranch: state.gitBranch,
        startedAt: state.startedAt,
        endedAt: state.lastTickAt,
        activeDurationMs,
        totalDurationMs,
        primaryLanguage,
        status: markActive ? WorkSessionStatus.ACTIVE : WorkSessionStatus.CLOSED,
      });
      const saved = await this.sessionsRepository.save(created);
      state.sessionId = saved.id;
      sessionId = saved.id;
    } else {
      sessionId = state.sessionId;
      await this.sessionsRepository.update(
        { id: state.sessionId },
        {
          gitBranch: state.gitBranch,
          startedAt: state.startedAt,
          endedAt: state.lastTickAt,
          activeDurationMs,
          totalDurationMs,
          primaryLanguage,
          status: markActive ? WorkSessionStatus.ACTIVE : WorkSessionStatus.CLOSED,
        },
      );
    }

    if (state.tickIds.length > 0) {
      await this.eventsRepository
        .createQueryBuilder()
        .update(TelemetryEvent)
        .set({ sessionId })
        .whereInIds(state.tickIds)
        .execute();
    }
  }

  public async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.connection.quit();
  }
}

interface SessionAggregationState {
  sessionId: WorkSession['id'] | null;
  userId: WorkSession['userId'];
  gitBranch: WorkSession['gitBranch'];
  startedAt: Date;
  lastTickAt: Date;
  tickCount: number;
  languageCounts: Map<string, number>;
  tickIds: Array<TelemetryEvent['id']>;
}

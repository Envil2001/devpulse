import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { Repository } from 'typeorm';

import { TelemetryEvent } from './entities/telemetry-event.entity';
import { TelemetryIngestJob } from './telemetry.queue';

const QUEUE_NAME = 'telemetry-events';

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
        apiKeyId: payload.apiKeyId as TelemetryEvent['apiKeyId'],
        userId: payload.userId as TelemetryEvent['userId'],
        projectId: null,
        sessionId: null,
        createdAt: now,
      }),
    );

    await this.eventsRepository.save(events);
  }

  public async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.connection.quit();
  }
}

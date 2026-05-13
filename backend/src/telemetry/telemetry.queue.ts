import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

import { type TypeId } from '@devpulse/lib';

import { type IngestTelemetryEventRequestDto } from './dto/ingest-telemetry-batch-request.dto';

export interface TelemetryIngestJob {
  apiKeyId: TypeId<'apiKeys'>;
  userId: TypeId<'users'>;
  events: Array<IngestTelemetryEventRequestDto>;
}

const QUEUE_NAME = 'telemetry-events';

function resolveRedisHost(): string {
  const host = process.env.REDIS_HOST ?? 'localhost';
  // When running services via docker-compose, other containers can use "redis" as host.
  // When running the backend on the host machine, prefer localhost.
  return host === 'redis' ? 'localhost' : host;
}

function resolveRedisPort(): number {
  return Number(process.env.REDIS_PORT ?? 6379);
}

@Injectable()
export class TelemetryQueue implements OnModuleDestroy {
  private readonly connection = new IORedis({
    host: resolveRedisHost(),
    port: resolveRedisPort(),
    maxRetriesPerRequest: null,
  });

  private readonly queue = new Queue<TelemetryIngestJob>(QUEUE_NAME, {
    connection: this.connection,
    defaultJobOptions: {
      removeOnComplete: 1000,
      removeOnFail: 10_000,
      attempts: 10,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  });

  public async enqueue(job: TelemetryIngestJob): Promise<void> {
    await this.queue.add('ingest', job);
  }

  public async onModuleDestroy(): Promise<void> {
    await this.queue.close();
    await this.connection.quit();
  }
}

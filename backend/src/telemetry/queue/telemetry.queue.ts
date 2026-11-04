import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

import { TypeId } from '@devpulse/lib';

import { BULL_REDIS_CLIENT } from '../../redis/redis.module';
import { TelemetryEventItemDto } from '../dto/request/ingest-telemetry-batch-request.dto';

export interface TelemetryJobData {
  userId: TypeId<'users'>;
  events: Array<TelemetryEventItemDto>;
  batchId?: string;
}

const QUEUE_NAME = 'telemetry-ingestion';
const JOB_NAME = 'process-batch';

@Injectable()
export class TelemetryQueue implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelemetryQueue.name);
  private queue!: Queue<TelemetryJobData>;

  constructor(@Inject(BULL_REDIS_CLIENT) private readonly redisConnection: Redis) {}

  public onModuleInit(): void {
    this.queue = new Queue<TelemetryJobData>(QUEUE_NAME, {
      connection: this.redisConnection,
    });
    this.logger.log(`Queue "${QUEUE_NAME}" initialised`);
  }

  public async onModuleDestroy(): Promise<void> {
    await this.queue.close();
    this.logger.log(`Queue "${QUEUE_NAME}" closed`);
  }

  public async getQueueMetrics(): Promise<{ waiting: number; active: number; failed: number }> {
    const counts = await this.queue.getJobCounts('waiting', 'active', 'failed', 'delayed');
    return {
      waiting: counts.waiting,
      active: counts.active,
      failed: counts.failed,
    };
  }

  public async addEventsJob(
    userId: TypeId<'users'>,
    events: Array<TelemetryEventItemDto>,
    batchId?: string,
  ): Promise<void> {
    await this.queue.add(
      JOB_NAME,
      { userId, events, batchId },
      {
        jobId: batchId ? `telemetry:${userId}:${batchId}` : undefined,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { age: 3600, count: 1000 },
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    );
  }
}

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { TelemetryEventItemDto } from '../dto/request/ingest-telemetry-batch-request.dto';
import { RedisService } from '../../redis/services/redis.service';
import { TypeId } from '@devpulse/lib';
import Redis from 'ioredis';
import { BULL_REDIS_CLIENT } from '../../redis/redis.module';

export interface TelemetryJobData {
  userId: TypeId<'users'>;
  events: TelemetryEventItemDto[];
}

@Injectable()
export class TelemetryQueue implements OnModuleInit {
  private readonly logger = new Logger(TelemetryQueue.name);
  private queue!: Queue<TelemetryJobData>;

  constructor(@Inject(BULL_REDIS_CLIENT) private readonly redisConnection: Redis) {}

  public async onModuleInit(): Promise<void> {
    this.queue = new Queue<TelemetryJobData>('telemetry-ingestion', {
      connection: this.redisConnection,
    });
  }

  public async addEventsJob(
    userId: TypeId<'users'>,
    events: TelemetryEventItemDto[],
  ): Promise<void> {
    await this.queue.add(
      'process-batch',
      { userId, events },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
      },
    );
  }
}

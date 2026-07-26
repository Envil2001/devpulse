import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

import { env } from '@devpulse/env/api';

import { RedisService } from './services/redis.service';

export const REDIS_CLIENT = 'REDIS_CLIENT';
export const BULL_REDIS_CLIENT = 'BULL_REDIS_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => new Redis(env.REDIS_URL),
    },
    {
      provide: BULL_REDIS_CLIENT,
      useFactory: () => new Redis(env.REDIS_URL, { maxRetriesPerRequest: null }),
    },
    RedisService,
  ],
  exports: [RedisService, BULL_REDIS_CLIENT],
})
export class RedisModule {}

import { Global, Module } from '@nestjs/common';
import { RedisService } from './services/redis.service';
import Redis from 'ioredis';
import { env } from '@devpulse/env/api';
import { REDIS_CLIENT } from './constants/redis.constants';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,

      useFactory: () => {
        return new Redis(env.REDIS_URL);
      },
    },

    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}

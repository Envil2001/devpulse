import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../constants/redis.constants';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  public onModuleInit(): void {
    this.redis.on('error', (err) => {
      this.logger.error('Redis connection error:', err);
    });

    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.redis.on('ready', () => {
      this.logger.log('Redis is ready to use');
    });

    this.redis.on('close', () => {
      this.logger.warn('Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      this.logger.warn('Reconnecting to Redis...');
    });
  }

  public onModuleDestroy(): void {
    this.redis.disconnect();
  }

  public getClient(): Redis {
    return this.redis;
  }

  public async set(
    key: string,
    value: string | number | object,
    ttlSeconds?: number,
  ): Promise<string | null> {
    const valueToStore = JSON.stringify(value);

    if (ttlSeconds) {
      return this.redis.set(key, valueToStore, 'EX', ttlSeconds);
    }

    return this.redis.set(key, valueToStore);
  }

  public async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);

    if (value === null) {
      return null;
    }

    return JSON.parse(value) as T;
  }

  public async del(key: string | Array<string>): Promise<number> {
    if (Array.isArray(key)) {
      if (key.length === 0) {
        return 0;
      }
      return this.redis.del(...key);
    }
    return this.redis.del(key);
  }
}

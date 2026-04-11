import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    PORT: z.coerce.number().default(3000),

    // PostgreSQL
    POSTGRES_USER: z.string().min(1),
    POSTGRES_PASSWORD: z.string().min(1),
    POSTGRES_DB: z.string().min(1),
    DATABASE_URL: z.string().url(),

    // Redis
    REDIS_HOST: z.string().min(1).default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),

    // JWT
    JWT_SECRET: z.string().min(1),
    JWT_EXPIRES_IN: z.string().default('7d'),
  },

  runtimeEnv: process.env,
});

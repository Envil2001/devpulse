/* eslint-disable unicorn/numeric-separators-style */
import { Module, type Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core/constants';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { env } from '@devpulse/env/api';

import { AnalyticsModule } from './analytics/analytics.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { ApiKey } from './api-keys/entities/api-key.entity';
import { AuthModule } from './auth/auth.module';
import { Project } from './projects/entities/project.entity';
import { RedisModule } from './redis/redis.module';
import { TelemetryEvent } from './telemetry/entities/telemetry-event.entity';
import { WorkSession } from './telemetry/entities/work-session.entity';
import { TelemetryModule } from './telemetry/telemetry.module';
import { User } from './users/entities/user.entity';
import { UserEncryption } from './users/entities/user-encryption.entity';
import { AppController } from './app.controller';
import { AppService } from './app.service';

const throttlerProvider: Provider = {
  provide: APP_GUARD,
  useClass: ThrottlerGuard,
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
    }),

    ThrottlerModule.forRoot([
      {
        name: 'burst',
        ttl: 1_000,
        limit: 10,
      },
      {
        name: 'sustained',
        ttl: 60_000,
        limit: 200,
      },
    ]),

    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: env.DATABASE_URL,
        entities: [User, UserEncryption, ApiKey, Project, TelemetryEvent, WorkSession],
        synchronize: env.NODE_ENV !== 'production',
      }),
    }),

    RedisModule,
    AuthModule,
    ApiKeysModule,
    TelemetryModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService, throttlerProvider],
})
export class AppModule {}

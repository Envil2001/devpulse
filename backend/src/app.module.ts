/* eslint-disable unicorn/numeric-separators-style */
import { Module, type Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core/constants';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApiKey } from './api-keys/entities/api-key.entity';
import { Project } from './projects/entities/project.entity';
import { TelemetryEvent } from './telemetry/entities/telemetry-event.entity';
import { WorkSession } from './telemetry/entities/work-session.entity';
import { User } from './users/entities/user.entity';
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

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: [User, ApiKey, Project, TelemetryEvent, WorkSession],
      synchronize: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService, throttlerProvider],
})
export class AppModule {}

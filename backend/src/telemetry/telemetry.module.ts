import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ApiKey } from '../api-keys/entities/api-key.entity';
import { Project } from '../projects/entities/project.entity';
import { UsersModule } from '../users/users.module';

import { TelemetryController } from './controllers/telemetry.controller';
import { TelemetryEvent } from './entities/telemetry-event.entity';
import { WorkSession } from './entities/work-session.entity';
import { ApiKeyGuard } from './guards/api-key.guard';
import { TelemetryQueue } from './queue/telemetry.queue';
import { TelemetryWorker } from './telemetry.worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([TelemetryEvent, WorkSession, ApiKey, Project]),
    ApiKeysModule,
    UsersModule,
  ],
  controllers: [TelemetryController],
  providers: [TelemetryQueue, TelemetryWorker, ApiKeyGuard],
})
export class TelemetryModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApiKey } from '../api-keys/entities/api-key.entity';

import { TelemetryEvent } from './entities/telemetry-event.entity';
import { WorkSession } from './entities/work-session.entity';
import { ApiKeyGuard } from './guards/api-key.guard';
import { TelemetryController } from './controllers/telemetry.controller';
import { TelemetryQueue } from './queue/telemetry.queue';
import { TelemetryWorker } from './telemetry.worker';
import { ApiKeysModule } from '../api-keys/api-keys.module';

@Module({
  imports: [TypeOrmModule.forFeature([TelemetryEvent, WorkSession, ApiKey]), ApiKeysModule],
  controllers: [TelemetryController],
  providers: [TelemetryQueue, TelemetryWorker, ApiKeyGuard],
})
export class TelemetryModule {}

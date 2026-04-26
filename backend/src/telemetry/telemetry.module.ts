import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApiKey } from '../api-keys/entities/api-key.entity';

import { TelemetryEvent } from './entities/telemetry-event.entity';
import { ApiKeyGuard } from './guards/api-key.guard';
import { TelemetryController } from './telemetry.controller';
import { TelemetryQueue } from './telemetry.queue';
import { TelemetryWorker } from './telemetry.worker';

@Module({
  imports: [TypeOrmModule.forFeature([TelemetryEvent, ApiKey])],
  controllers: [TelemetryController],
  providers: [TelemetryQueue, TelemetryWorker, ApiKeyGuard],
})
export class TelemetryModule {}

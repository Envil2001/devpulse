import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApiKeysModule } from '../api-keys/api-keys.module';
import { UsersModule } from '../users/users.module';

import { TelemetryController } from './controllers/telemetry.controller';
import { WorkSession } from './entities/work-session.entity';
import { TelemetryQueue } from './queue/telemetry.queue';
import { TelemetryWorker } from './telemetry.worker';

@Module({
  imports: [ApiKeysModule, UsersModule, TypeOrmModule.forFeature([WorkSession])],
  controllers: [TelemetryController],
  providers: [TelemetryQueue, TelemetryWorker],
})
export class TelemetryModule {}

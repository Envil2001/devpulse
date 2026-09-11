import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkSession } from '../telemetry/entities/work-session.entity';

import { AnalyticsController } from './controllers/analytics.controller';
import { CsvExportFormatterService } from './formatters/csv-export-formatter.service';
import { AnalyticsService } from './services/analytics.service';
import { AnalyticsExportService } from './services/analytics-export.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkSession])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, CsvExportFormatterService, AnalyticsExportService],
})
export class AnalyticsModule {}

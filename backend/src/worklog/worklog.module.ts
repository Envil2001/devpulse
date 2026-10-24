import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkSession } from '../telemetry/entities/work-session.entity';
import { User } from '../users/entities/user.entity';

import { WorklogController } from './controllers/worklog.controller';
import { WorklogEntry } from './entities/worklog-entry.entity';
import { AI_SUMMARY_GENERATOR } from './interfaces/ai-summary-generator.interface';
import { DayFactsService } from './services/day-facts.service';
import { OpenAiCompatibleSummaryService } from './services/openai-compatible-summary.service';
import { WorklogService } from './services/worklog.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkSession, User, WorklogEntry])],
  controllers: [WorklogController],
  providers: [
    WorklogService,
    DayFactsService,
    {
      provide: AI_SUMMARY_GENERATOR,
      useClass: OpenAiCompatibleSummaryService,
    },
  ],
})
export class WorklogModule {}

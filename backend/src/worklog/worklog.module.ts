import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkSession } from '../telemetry/entities/work-session.entity';
import { User } from '../users/entities/user.entity';

import { WorklogController } from './controllers/worklog.controller';
import { AI_SUMMARY_GENERATOR } from './interfaces/ai-summary-generator.interface';
import { OpenAiSummaryService } from './services/openai-summary.service';
import { WorklogService } from './services/worklog.service';

@Module({
  imports: [TypeOrmModule.forFeature([WorkSession, User])],
  controllers: [WorklogController],
  providers: [
    WorklogService,
    {
      provide: AI_SUMMARY_GENERATOR,
      useClass: OpenAiSummaryService,
    },
  ],
})
export class WorklogModule {}

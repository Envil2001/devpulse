import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { type AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { User } from '../../users/entities/user.entity';
import { IngestTelemetryBatchRequestDto } from '../dto/request/ingest-telemetry-batch-request.dto';
import { IngestTelemetryBatchResponseDto } from '../dto/response/ingest-telemetry-batch-response.dto';
import { WorkSession } from '../entities/work-session.entity';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { TelemetryQueue } from '../queue/telemetry.queue';

interface WorkSessionSummary {
  id: string;
  startedAt: string;
  endedAt: string;
  projectName: string;
  gitBranch: string | null;
  durationMs: number;
  focusScore: number;
  earnedMoney: number;
}

@Controller('telemetry')
export class TelemetryController {
  constructor(
    private readonly telemetryQueue: TelemetryQueue,
    @InjectRepository(WorkSession)
    private readonly sessionRepo: Repository<WorkSession>,
  ) {}

  @Post('events/batch')
  @UseGuards(ApiKeyGuard)
  @HttpCode(HttpStatus.OK)
  public async ingestBatch(
    @CurrentUser() user: User,
    @Body() dto: IngestTelemetryBatchRequestDto,
  ): Promise<IngestTelemetryBatchResponseDto> {
    await this.telemetryQueue.addEventsJob(user.id, dto.events);

    return {
      success: true,
      processedCount: dto.events.length,
      message: 'Telemetry batch queued for background processing',
    };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  public async getSessions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Array<WorkSessionSummary>> {
    const sessions = await this.sessionRepo.find({
      where: { userId: user.id },
      relations: ['project'],
      order: { startedAt: 'DESC' },
      take: 50,
    });

    return sessions.map((session): WorkSessionSummary => {
      return {
        id: session.id,
        startedAt: session.startedAt.toISOString(),
        endedAt: session.endedAt?.toISOString() ?? session.startedAt.toISOString(),
        projectName: session.project?.name ?? 'Unknown Project',
        gitBranch: session.gitBranch,
        durationMs: session.activeSeconds * 1000,
        focusScore: Math.round(session.focusScore),
        earnedMoney: session.earnedMoney,
      };
    });
  }
}

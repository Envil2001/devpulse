import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RequireScopes } from '../../api-keys/decorators/require-scopes.decorator';
import { ApiKeyScope } from '../../api-keys/enums/api-key.enums';
import { ApiKeyGuard } from '../../api-keys/guards/api-key.guard';
import { ScopesGuard } from '../../api-keys/guards/scopes.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { type AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { TelemetryThrottle } from '../../common/decorators/throtte.decorators';
import { User } from '../../users/entities/user.entity';
import { IngestTelemetryBatchRequestDto } from '../dto/request/ingest-telemetry-batch-request.dto';
import { IngestTelemetryBatchResponseDto } from '../dto/response/ingest-telemetry-batch-response.dto';
import { WorkSessionDetailDto } from '../dto/response/work-session-detail.dto';
import { WorkSessionSummaryDto } from '../dto/response/work-session-summary.dto';
import { WorkSession } from '../entities/work-session.entity';
import { TelemetryQueue } from '../queue/telemetry.queue';

@Controller('telemetry')
export class TelemetryController {
  private readonly logger = new Logger(TelemetryController.name);

  constructor(
    private readonly telemetryQueue: TelemetryQueue,
    @InjectRepository(WorkSession)
    private readonly sessionRepo: Repository<WorkSession>,
  ) {}

  @Post('events/batch')
  @UseGuards(ApiKeyGuard, ScopesGuard)
  @RequireScopes(ApiKeyScope.TELEMETRY_WRITE)
  @TelemetryThrottle()
  @HttpCode(HttpStatus.OK)
  public async ingestBatch(
    @CurrentUser() user: User,
    @Body() dto: IngestTelemetryBatchRequestDto,
  ): Promise<IngestTelemetryBatchResponseDto> {
    this.logger.log(`Received ${String(dto.events.length)} events from user ${user.id}`);

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
    @Query('limit') limit?: string,
    @Query('projectId') projectId?: string,
  ): Promise<Array<WorkSessionSummaryDto>> {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : 50;
    const safeLimit = Math.min(Math.max(Number.isNaN(parsedLimit) ? 50 : parsedLimit, 1), 100);

    const where: Record<string, unknown> = { userId: user.id };
    if (projectId) {
      where.projectId = projectId;
    }

    const sessions = await this.sessionRepo.find({
      where,
      relations: ['project'],
      order: { startedAt: 'DESC' },
      take: safeLimit,
    });

    return sessions.map((session): WorkSessionSummaryDto => {
      return {
        id: session.id,
        startedAt: session.startedAt.toISOString(),
        endedAt: session.endedAt?.toISOString() ?? session.startedAt.toISOString(),
        projectName: session.project?.name ?? 'Unknown Project',
        gitBranch: session.gitBranch,
        durationMs: session.activeSeconds * 1000,
        focusScore: Math.round(session.focusScore),
        earnedMoney: session.earnedMoney,
        primaryLanguage: session.primaryLanguage,
        status: session.status,
      };
    });
  }

  @Get('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  public async getSessionDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<WorkSessionDetailDto> {
    const session = await this.sessionRepo
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.project', 'project')
      .where('session.id = :id', { id })
      .andWhere('session.userId = :userId', { userId: user.id })
      .getOne();

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return {
      id: session.id,
      projectName: session.project?.name ?? null,
      gitBranch: session.gitBranch,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt?.toISOString() ?? null,
      activeSeconds: session.activeSeconds,
      idleSeconds: session.idleSeconds,
      focusScore: Math.round(session.focusScore),
      earnedMoney: session.earnedMoney,
      primaryLanguage: session.primaryLanguage,
      languageSeconds: session.languageSeconds,
      commandsRun: session.commandsRun,
      failedCommands: session.failedCommands,
      terminalCommands: session.terminalCommands.map((cmd) => ({
        command: cmd.command,
        cwd: cmd.cwd,
        exitCode: cmd.exitCode,
        durationMs: cmd.durationMs,
        kind: cmd.kind,
        timestamp: cmd.timestamp,
      })),
      status: session.status,
    };
  }
}

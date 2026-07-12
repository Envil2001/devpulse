import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../users/entities/user.entity';
import { IngestTelemetryBatchRequestDto } from '../dto/request/ingest-telemetry-batch-request.dto';
import { IngestTelemetryBatchResponseDto } from '../dto/response/ingest-telemetry-batch-response.dto';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { TelemetryQueue } from '../queue/telemetry.queue';

@Controller('telemetry')
export class TelemetryController {
  constructor(private readonly telemetryQueue: TelemetryQueue) {}

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
}

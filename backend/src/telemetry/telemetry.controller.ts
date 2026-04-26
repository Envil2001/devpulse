import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { TelemetryThrottle } from '../common/decorators/throtte.decorators';

import { IngestTelemetryBatchDto } from './dto/ingest-telemetry-batch.dto';
import { ApiKeyGuard, type ApiKeyPrincipal } from './guards/api-key.guard';
import { TelemetryQueue } from './telemetry.queue';

@Controller({ path: 'telemetry', version: '1' })
export class TelemetryController {
  constructor(private readonly telemetryQueue: TelemetryQueue) {}

  @Post('events/batch')
  @HttpCode(HttpStatus.ACCEPTED)
  @TelemetryThrottle()
  @UseGuards(ApiKeyGuard)
  public async ingestBatch(
    @Req() req: Request,
    @Body() dto: IngestTelemetryBatchDto,
  ): Promise<{
    accepted: number;
  }> {
    const principal = (req as unknown as { apiKeyPrincipal?: ApiKeyPrincipal }).apiKeyPrincipal;
    if (principal === undefined) {
      // Should be prevented by guard.
      return { accepted: 0 };
    }

    await this.telemetryQueue.enqueue({
      apiKeyId: principal.apiKeyId,
      userId: principal.userId,
      events: dto.events,
    });

    return { accepted: dto.events.length };
  }
}

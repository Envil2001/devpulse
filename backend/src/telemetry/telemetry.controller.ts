import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { type TypeId } from '@devpulse/lib';

import { TelemetryThrottle } from '../common/decorators/throtte.decorators';

import { IngestTelemetryBatchRequestDto } from './dto/ingest-telemetry-batch-request.dto';
import { type IngestTelemetryBatchResponseDto } from './dto/ingest-telemetry-batch-response.dto';
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
    @Body() dto: IngestTelemetryBatchRequestDto,
  ): Promise<IngestTelemetryBatchResponseDto> {
    const principal = (req as unknown as { apiKeyPrincipal?: ApiKeyPrincipal }).apiKeyPrincipal;
    if (principal === undefined) {
      // Should be prevented by guard.
      return { accepted: 0 };
    }

    await this.telemetryQueue.enqueue({
      apiKeyId: principal.apiKeyId as TypeId<'apiKeys'>,
      userId: principal.userId as TypeId<'users'>,
      events: dto.events,
    });

    return { accepted: dto.events.length };
  }
}

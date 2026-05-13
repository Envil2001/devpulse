import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { TelemetryEventType } from '../entities/telemetry-event.entity';

export class IngestTelemetryEventRequestDto {
  @IsEnum(TelemetryEventType)
  public type: TelemetryEventType;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  public gitBranch: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  public filePath: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  public language: string | null;

  @IsOptional()
  @IsInt()
  public durationMs: number | null;

  @IsDateString()
  public clientTimestamp: string;
}

export class IngestTelemetryBatchRequestDto {
  @ValidateNested({ each: true })
  @Type(() => IngestTelemetryEventRequestDto)
  public events: Array<IngestTelemetryEventRequestDto>;
}

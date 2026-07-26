import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { type TelemetryEventDto } from '@devpulse/lib';

export class TelemetryEventItemDto implements TelemetryEventDto {
  @ApiProperty({ description: 'Event type' })
  @IsEnum(['heartbeat', 'file_save', 'file_switch', 'idle_start', 'idle_end'])
  public type!: 'heartbeat' | 'file_save' | 'file_switch' | 'idle_start' | 'idle_end';

  @ApiProperty({ description: 'Git branch name (e.g., main, develop)' })
  @IsString()
  @IsOptional()
  public gitBranch!: string;

  @ApiProperty({ description: 'Git remote origin URL (e.g. github.com/org/repo.git)' })
  @IsString()
  @IsOptional()
  public gitRemoteUrl?: string;

  @ApiProperty({ description: 'File path' })
  @IsString()
  @IsOptional()
  public filePath?: string;

  @ApiProperty({ description: 'Programming language' })
  @IsString()
  @IsOptional()
  public language?: string;

  @ApiProperty({ description: 'Duration in milliseconds' })
  @IsInt()
  @Min(0)
  @IsOptional()
  public durationMs?: number | null;

  @ApiProperty({ description: 'Client timestamp' })
  @IsDateString()
  @IsOptional()
  public clientTimestamp?: string;
}

export class IngestTelemetryBatchRequestDto {
  @ApiProperty({ type: [TelemetryEventItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TelemetryEventItemDto)
  public events!: Array<TelemetryEventItemDto>;
}

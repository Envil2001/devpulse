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
  type!: 'heartbeat' | 'file_save' | 'file_switch' | 'idle_start' | 'idle_end';

  @ApiProperty({ description: 'Git branch name (e.g., main, develop)' })
  @IsString()
  @IsOptional()
  gitBranch!: string;

  @ApiProperty({ description: 'Git remote origin URL (e.g. github.com/org/repo.git)' })
  @IsString()
  @IsOptional()
  gitRemoteUrl?: string;

  @ApiProperty({ description: 'File path' })
  @IsString()
  @IsOptional()
  filePath?: string;

  @ApiProperty({ description: 'Programming language' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ description: 'Duration in milliseconds' })
  @IsInt()
  @Min(0)
  @IsOptional()
  durationMs?: number | null;

  @ApiProperty({ description: 'Client timestamp' })
  @IsDateString()
  @IsOptional()
  clientTimestamp?: string;
}

export class IngestTelemetryBatchRequestDto {
  @ApiProperty({ type: [TelemetryEventItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TelemetryEventItemDto)
  events!: TelemetryEventItemDto[];
}

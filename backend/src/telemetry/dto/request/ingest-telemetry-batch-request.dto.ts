import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { type TelemetryEventDto } from '@devpulse/lib';

export class TelemetryEventItemDto implements TelemetryEventDto {
  @ApiProperty({
    description: 'Event type',
    enum: [
      'heartbeat',
      'file_save',
      'file_switch',
      'idle_start',
      'idle_end',
      'session_end',
      'terminal_command',
      'task_run',
    ],
  })
  @IsIn([
    'heartbeat',
    'file_save',
    'file_switch',
    'idle_start',
    'idle_end',
    'session_end',
    'terminal_command',
    'task_run',
  ])
  public type!:
    | 'heartbeat'
    | 'file_save'
    | 'file_switch'
    | 'idle_start'
    | 'idle_end'
    | 'session_end'
    | 'terminal_command'
    | 'task_run';

  @ApiProperty({ description: 'Git branch name (e.g., main, develop)' })
  @IsString()
  @IsOptional()
  public gitBranch!: string | null;

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

  @ApiProperty({ description: 'VS Code machine identifier', required: false })
  @IsString()
  @IsOptional()
  public machineId?: string;

  @ApiProperty({ description: 'VS Code session identifier', required: false })
  @IsString()
  @IsOptional()
  public sessionId?: string;

  @ApiProperty({ description: 'Sanitized terminal command text', required: false })
  @IsString()
  @IsOptional()
  public command?: string;

  @ApiProperty({ description: 'Working directory of the command', required: false })
  @IsString()
  @IsOptional()
  public commandCwd?: string | null;

  @ApiProperty({ description: 'Exit code (0 = success)', required: false })
  @IsInt()
  @IsOptional()
  public exitCode?: number | null;

  @ApiProperty({ description: 'Task name from Tasks API', required: false })
  @IsString()
  @IsOptional()
  public taskName?: string;

  @ApiProperty({ description: 'Task source (npm, typescript, gulp, shell, ...)', required: false })
  @IsString()
  @IsOptional()
  public taskSource?: string;
}

export class IngestTelemetryBatchRequestDto {
  @ApiProperty({ type: [TelemetryEventItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TelemetryEventItemDto)
  public events!: Array<TelemetryEventItemDto>;
}

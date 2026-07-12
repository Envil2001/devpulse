import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class TelemetryEventItemDto {
  @ApiProperty({ description: 'Git branch name (e.g., main, develop)' })
  @IsString()
  @IsNotEmpty()
  branch!: string;

  @ApiProperty({ description: 'Git remote origin URL (e.g. github.com/org/repo.git)' })
  @IsString()
  @IsOptional()
  gitRemoteUrl?: string;

  @ApiProperty({ description: 'ISO Timestamp of the heartbeat' })
  @IsDateString()
  timestamp!: string;

  @ApiProperty({ description: 'Active typing seconds in the last minute' })
  @IsInt()
  @Min(0)
  activeSeconds!: number;

  @ApiProperty({ description: 'Idle seconds in the last minute' })
  @IsInt()
  @Min(0)
  idleSeconds!: number;

  @ApiProperty({ description: 'List of edited file paths' })
  @IsArray()
  @IsString({ each: true })
  filesChanged!: string[];

  @ApiProperty({ description: 'List of file extensions (ts, json, etc.)' })
  @IsArray()
  @IsString({ each: true })
  fileExtensions!: string[];
}

export class IngestTelemetryBatchRequestDto {
  @ApiProperty({ type: [TelemetryEventItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TelemetryEventItemDto)
  events!: TelemetryEventItemDto[];
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class GetAnalyticsRangeRequestDto {
  @ApiPropertyOptional({
    description: 'Inclusive range start as an ISO 8601 timestamp',
    example: '2026-11-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  public startDate?: string;

  @ApiPropertyOptional({
    description: 'Inclusive range end as an ISO 8601 timestamp',
    example: '2026-11-07T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  public endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by DevPulse project ID',
    example: 'p_abc123def456',
  })
  @IsOptional()
  @IsString()
  public projectId?: string;
}

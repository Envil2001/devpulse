import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class GetAnalyticsRangeRequestDto {
  @ApiPropertyOptional({ description: 'Start date (ISO format)' })
  @IsOptional()
  @IsDateString()
  public startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)' })
  @IsOptional()
  @IsDateString()
  public endDate?: string;

  @ApiPropertyOptional({ description: 'Filter by Project ID' })
  @IsOptional()
  @IsString()
  public projectId?: string;
}

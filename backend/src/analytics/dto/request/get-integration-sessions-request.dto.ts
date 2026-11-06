import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GetIntegrationSessionsRequestDto {
  @ApiPropertyOptional({
    description: 'Maximum number of most recent sessions to return; values above 50 are capped',
    example: 10,
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public limit?: number;

  @ApiPropertyOptional({
    description: 'Return sessions for one project ID',
    example: 'p_abc123def456',
  })
  @IsOptional()
  @IsString()
  public projectId?: string;
}

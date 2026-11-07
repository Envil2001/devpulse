import { ApiProperty } from '@nestjs/swagger';

import { type AiRoiMetrics } from '@devpulse/lib';

export class GetIntegrationAiRoiResponseDto implements AiRoiMetrics {
  @ApiProperty({ example: 4, description: 'Number of AI-assisted sessions' })
  public aiSessionsCount!: number;

  @ApiProperty({ example: 8, description: 'Number of manual coding sessions' })
  public manualSessionsCount!: number;

  @ApiProperty({ example: 23, description: 'Total AI prompts or completions detected' })
  public totalAiInteractions!: number;

  @ApiProperty({ example: 5400, description: 'Active seconds in AI-assisted sessions' })
  public aiActiveSeconds!: number;

  @ApiProperty({ example: 7200, description: 'Active seconds in sessions without detected AI use' })
  public manualActiveSeconds!: number;

  @ApiProperty({
    example: 3600,
    description: 'Required active seconds in each group before a comparison is shown',
  })
  public minimumComparisonSeconds!: number;

  @ApiProperty({
    example: true,
    description: 'Whether both AI-assisted and non-AI samples are large enough to compare',
  })
  public comparisonReady!: boolean;

  @ApiProperty({
    example: 520,
    description: 'Committed line changes per active hour during AI-assisted sessions',
  })
  public aiVelocityLinesPerHour!: number;

  @ApiProperty({
    example: 290,
    description: 'Committed line changes per active hour during sessions without detected AI use',
  })
  public manualVelocityLinesPerHour!: number;

  @ApiProperty({
    example: 79.3,
    description:
      'Signed estimated change in committed-line throughput; 0 when comparison is unavailable',
  })
  public speedupPercentage!: number;

  @ApiProperty({
    example: 2.5,
    description: 'Estimated hours saved from throughput comparison; 0 when unavailable',
  })
  public estimatedHoursSaved!: number;
}

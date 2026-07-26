import { ApiProperty } from '@nestjs/swagger';

export class GetAnalyticsDashboardResponseDto {
  @ApiProperty({ description: 'Total active coding time in seconds' })
  public totalActiveSeconds!: number;

  @ApiProperty({ description: 'Total money earned in user currency' })
  public totalEarnedMoney!: number;

  @ApiProperty({ description: 'Average focus score (0-100%)' })
  public averageFocusScore!: number;

  @ApiProperty({ description: 'Number of active/completed work sessions' })
  public totalSessionsCount!: number;

  @ApiProperty({ description: 'Most used programming language' })
  public topLanguage!: string | null;
}

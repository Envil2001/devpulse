import { ApiProperty } from '@nestjs/swagger';

export class GetAnalyticsDashboardResponseDto {
  @ApiProperty({ description: 'Total active coding time in seconds' })
  totalActiveSeconds!: number;

  @ApiProperty({ description: 'Total money earned in user currency' })
  totalEarnedMoney!: number;

  @ApiProperty({ description: 'Average focus score (0-100%)' })
  averageFocusScore!: number;

  @ApiProperty({ description: 'Number of active/completed work sessions' })
  totalSessionsCount!: number;

  @ApiProperty({ description: 'Most used programming language' })
  topLanguage!: string | null;
}

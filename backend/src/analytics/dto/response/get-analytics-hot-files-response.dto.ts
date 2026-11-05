import { ApiProperty } from '@nestjs/swagger';

import { type HotFilesAnalytics, type HotPathMetric } from '@devpulse/lib';

export class HotPathMetricDto implements HotPathMetric {
  @ApiProperty({ example: 'src/auth/auth.service.ts', description: 'Workspace-relative path' })
  public path!: string;

  @ApiProperty({ example: 7200, description: 'Attributed active editor time in seconds' })
  public activeSeconds!: number;

  @ApiProperty({ example: 50, description: 'Share of all file-attributed time in the period' })
  public percentage!: number;
}

export class GetAnalyticsHotFilesResponseDto implements HotFilesAnalytics {
  @ApiProperty({
    example: 14_400,
    description: 'Total active seconds that could be attributed to an editor file',
  })
  public totalAttributedSeconds!: number;

  @ApiProperty({ type: [HotPathMetricDto], description: 'Top five workspace-relative files' })
  public files!: Array<HotPathMetricDto>;

  @ApiProperty({ type: [HotPathMetricDto], description: 'Top five immediate parent folders' })
  public folders!: Array<HotPathMetricDto>;
}

import { ApiProperty } from '@nestjs/swagger';

export class WorkSessionSummaryDto {
  @ApiProperty({ description: 'Work session ID' })
  public id!: string;

  @ApiProperty({ description: 'Session start time' })
  public startedAt!: string;

  @ApiProperty({ description: 'Session end time' })
  public endedAt!: string;

  @ApiProperty({ description: 'Project name' })
  public projectName!: string;

  @ApiProperty({
    description: 'Git branch name',
    nullable: true,
  })
  public gitBranch!: string | null;

  @ApiProperty({ description: 'Active duration in milliseconds' })
  public durationMs!: number;

  @ApiProperty({ description: 'Focus score' })
  public focusScore!: number;

  @ApiProperty({ description: 'Earned money' })
  public earnedMoney!: number;
}

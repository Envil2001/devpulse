import { ApiProperty } from '@nestjs/swagger';

import { type TypeId } from '@devpulse/lib';

export class WorkSessionSummaryDto {
  @ApiProperty({ description: 'Work session ID', example: 'ws_123456789' })
  public id!: TypeId<'workSessions'>;

  @ApiProperty({ description: 'Session start time' })
  public startedAt!: string;

  @ApiProperty({ description: 'Time of the last event of the session' })
  public endedAt!: string;

  @ApiProperty({ description: 'Project name' })
  public projectName!: string;

  @ApiProperty({
    description: 'Git branch name',
    nullable: true,
  })
  public gitBranch!: string | null;

  @ApiProperty({ description: 'Active duration in seconds' })
  public durationSeconds!: number;

  @ApiProperty({ description: 'Focus score' })
  public focusScore!: number;

  @ApiProperty({ description: 'Earned money' })
  public earnedMoney!: number;

  @ApiProperty({
    description: 'Primary language of the session',
    nullable: true,
  })
  public primaryLanguage!: string | null;

  @ApiProperty({
    description: 'Session status',
    enum: ['active', 'closed'],
  })
  public status!: 'active' | 'closed';

  @ApiProperty({
    description:
      'The session is running right now: it is active and its last event is recent. A session stays "active" in the database until the next event closes it.',
  })
  public isLive!: boolean;
}

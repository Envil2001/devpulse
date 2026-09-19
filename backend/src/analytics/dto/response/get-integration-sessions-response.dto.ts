import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { type TypeId } from '@devpulse/lib';

export class GetIntegrationSessionItemDto {
  @ApiProperty({ example: 'ws_12345...' })
  public id!: TypeId<'workSessions'>;

  @ApiProperty({ example: 'devpulse-backend' })
  public projectName!: string;

  @ApiPropertyOptional({ example: 'main' })
  public gitBranch!: string | null;

  @ApiProperty({ example: '2026-09-18T14:00:00.000Z' })
  public startedAt!: Date;

  @ApiPropertyOptional({ example: '2026-09-18T16:00:00.000Z' })
  public endedAt!: Date | null;

  @ApiProperty({ example: 7200, description: 'Duration in seconds' })
  public durationSeconds!: number;

  @ApiProperty({ example: 95 })
  public focusScore!: number;

  @ApiProperty({ example: 60.5 })
  public earnedMoney!: number;
}

import { ApiProperty } from '@nestjs/swagger';

export class CommandStatItemDto {
  @ApiProperty({ description: 'Command text or task name' })
  public command!: string;

  @ApiProperty({
    description: 'Command kind',
    enum: ['test', 'build', 'lint', 'install', 'git', 'task', 'other'],
  })
  public kind!: string;

  @ApiProperty({ description: 'Number of runs' })
  public runs!: number;

  @ApiProperty({ description: 'Number of failed runs (non-zero exit code)' })
  public failedRuns!: number;

  @ApiProperty({ description: 'Average duration in milliseconds' })
  public avgDurationMs!: number;

  @ApiProperty({ description: 'Success rate in percent (0-100)' })
  public successRate!: number;
}

export class GetAnalyticsCommandsResponseDto {
  @ApiProperty({ description: 'Total commands run in period' })
  public totalCommands!: number;

  @ApiProperty({ description: 'Commands grouped by text', type: [CommandStatItemDto] })
  public commands!: Array<CommandStatItemDto>;
}

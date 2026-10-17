import { ApiProperty } from '@nestjs/swagger';

export class SessionCommandDto {
  @ApiProperty()
  public command!: string;

  @ApiProperty({ nullable: true })
  public cwd!: string | null;

  @ApiProperty({ nullable: true })
  public exitCode!: number | null;

  @ApiProperty()
  public durationMs!: number;

  @ApiProperty()
  public kind!: string;

  @ApiProperty()
  public timestamp!: string;
}

export class WorkSessionDetailDto {
  @ApiProperty()
  public id!: string;

  @ApiProperty({ nullable: true })
  public projectName!: string | null;

  @ApiProperty({ nullable: true })
  public gitBranch!: string | null;

  @ApiProperty()
  public startedAt!: string;

  @ApiProperty({ nullable: true })
  public endedAt!: string | null;

  @ApiProperty()
  public activeSeconds!: number;

  @ApiProperty()
  public idleSeconds!: number;

  @ApiProperty()
  public focusScore!: number;

  @ApiProperty()
  public earnedMoney!: number;

  @ApiProperty({ nullable: true })
  public primaryLanguage!: string | null;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  public languageSeconds!: Record<string, number>;

  @ApiProperty()
  public commandsRun!: number;

  @ApiProperty()
  public failedCommands!: number;

  @ApiProperty({ type: [SessionCommandDto] })
  public terminalCommands!: Array<SessionCommandDto>;

  @ApiProperty({ enum: ['active', 'closed'] })
  public status!: 'active' | 'closed';
}

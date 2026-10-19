import { ApiProperty } from '@nestjs/swagger';

export class SessionCommitDto {
  @ApiProperty()
  public hash!: string;

  @ApiProperty()
  public message!: string;

  @ApiProperty()
  public filesChanged!: number;

  @ApiProperty()
  public insertions!: number;

  @ApiProperty()
  public deletions!: number;

  @ApiProperty({ type: [String] })
  public filesList!: Array<string>;

  @ApiProperty()
  public timestamp!: string;
}

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

  @ApiProperty({
    description: 'Language seconds histogram',
    type: 'object',
    additionalProperties: { type: 'number' },
    nullable: true,
  })
  public languageSeconds!: Record<string, number> | null;

  @ApiProperty()
  public commandsRun!: number;

  @ApiProperty()
  public failedCommands!: number;

  @ApiProperty({ type: [SessionCommandDto] })
  public terminalCommands!: Array<SessionCommandDto>;

  @ApiProperty({ enum: ['active', 'closed'] })
  public status!: 'active' | 'closed';

  @ApiProperty()
  public commitsCount!: number;

  @ApiProperty({ type: [SessionCommitDto] })
  public commits!: Array<SessionCommitDto>;
}

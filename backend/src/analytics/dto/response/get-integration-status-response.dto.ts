import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type TrackerInactiveReason = 'no-data' | 'session-closed' | 'signal-stale';

export class GetIntegrationStatusResponseDto {
  @ApiProperty({
    example: true,
    description: 'Whether the user has an ongoing active coding session',
  })
  public isCodingNow!: boolean;

  @ApiPropertyOptional({ example: 'devpulse-backend' })
  public currentProject!: string | null;

  @ApiPropertyOptional({ example: 'feat/public-api' })
  public currentBranch!: string | null;

  @ApiPropertyOptional({ example: 'typescript' })
  public currentLanguage!: string | null;

  @ApiPropertyOptional({ example: 1800, description: 'Seconds elapsed in current active session' })
  public currentSessionDurationSeconds!: number | null;

  @ApiPropertyOptional({ example: '2026-09-18T20:00:00.000Z' })
  public sessionStartedAt!: Date | null;

  @ApiPropertyOptional({
    enum: ['no-data', 'session-closed', 'signal-stale'],
    nullable: true,
    description:
      'Server-observable reason why no live activity is shown. Exact local blockers remain in the VS Code extension.',
  })
  public inactiveReason!: TrackerInactiveReason | null;

  @ApiPropertyOptional({
    example: '2026-09-18T20:42:00.000Z',
    nullable: true,
    description: 'Timestamp of the latest activity signal known to the server',
  })
  public lastSignalAt!: Date | null;
}

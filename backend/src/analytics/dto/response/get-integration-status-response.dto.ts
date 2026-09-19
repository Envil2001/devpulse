import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}

import { ApiProperty } from '@nestjs/swagger';

export class GetIntegrationAiRoiResponseDto {
  @ApiProperty({ example: 4, description: 'Number of AI-assisted sessions' })
  public aiSessionsCount!: number;

  @ApiProperty({ example: 8, description: 'Number of manual coding sessions' })
  public manualSessionsCount!: number;

  @ApiProperty({ example: 23, description: 'Total AI prompts or completions detected' })
  public totalAiInteractions!: number;

  @ApiProperty({ example: 520, description: 'Lines of code per hour during AI sessions' })
  public aiVelocityLinesPerHour!: number;

  @ApiProperty({ example: 290, description: 'Lines of code per hour during manual sessions' })
  public manualVelocityLinesPerHour!: number;

  @ApiProperty({ example: 79.3, description: 'Productivity speedup percentage' })
  public speedupPercentage!: number;

  @ApiProperty({ example: 2.5, description: 'Estimated hours saved using AI' })
  public estimatedHoursSaved!: number;
}

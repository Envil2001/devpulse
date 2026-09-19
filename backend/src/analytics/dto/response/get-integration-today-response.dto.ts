import { ApiProperty } from '@nestjs/swagger';

export class GetIntegrationTodayResponseDto {
  @ApiProperty({ example: '2026-09-18' })
  public date!: string;

  @ApiProperty({ example: 'Europe/Warsaw' })
  public timezone!: string;

  @ApiProperty({ example: 'USD' })
  public currency!: string;

  @ApiProperty({ example: 14_460, description: 'Total coding time in seconds' })
  public totalActiveSeconds!: number;

  @ApiProperty({ example: '4h 1m', description: 'Human-readable formatted time' })
  public formattedTime!: string;

  @ApiProperty({ example: 120.5 })
  public totalEarnedMoney!: number;

  @ApiProperty({ example: 88 })
  public averageFocusScore!: number;

  @ApiProperty({ example: 3 })
  public sessionsCount!: number;
}

import { ApiProperty } from '@nestjs/swagger';

export class ProjectSummaryDto {
  @ApiProperty({ description: 'Unique project identifier', example: 'p_123456789' })
  public id!: string;

  @ApiProperty({ description: 'Project name', example: 'DevPulse' })
  public name!: string;

  @ApiProperty({
    description: 'Git remote URL',
    nullable: true,
    example: 'https://github.com/Envil2001/devpulse.git',
  })
  public remote!: string | null;

  @ApiProperty({ description: 'Total active time formatted', example: '12h 30m' })
  public activeTime!: string;

  @ApiProperty({ description: 'Average focus score (0-100)', example: 85 })
  public focusScore!: number;

  @ApiProperty({ description: 'Total sessions in this project', example: 42 })
  public sessions!: number;

  @ApiProperty({
    description: 'Last activity timestamp',
    nullable: true,
    example: '2026-10-18T15:45:00.000Z',
  })
  public lastActive!: string | null;
}

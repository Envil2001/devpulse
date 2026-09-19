import { ApiProperty } from '@nestjs/swagger';

export class LanguageStatItemDto {
  @ApiProperty({ example: 'typescript' })
  public language!: string;

  @ApiProperty({ example: 18_000, description: 'Total active seconds spent' })
  public activeSeconds!: number;

  @ApiProperty({ example: '5h 0m' })
  public formattedTime!: string;

  @ApiProperty({ example: 62.5, description: 'Percentage of total time' })
  public percentage!: number;
}

export class GetIntegrationLanguagesResponseDto {
  @ApiProperty({ example: 28_800, description: 'Total tracked seconds across all languages' })
  public totalActiveSeconds!: number;

  @ApiProperty({ type: [LanguageStatItemDto] })
  public languages!: Array<LanguageStatItemDto>;
}

import { ApiProperty } from '@nestjs/swagger';

export class TimeseriesDataPointDto {
  @ApiProperty({ description: 'Date in YYYY-MM-DD format' })
  date!: string;

  @ApiProperty({ description: 'Active coding seconds for this day' })
  activeSeconds!: number;

  @ApiProperty({ description: 'Money earned for this day' })
  earnedMoney!: number;
}

export class GetAnalyticsTimeseriesResponseDto {
  @ApiProperty({ type: [TimeseriesDataPointDto] })
  series!: TimeseriesDataPointDto[];
}

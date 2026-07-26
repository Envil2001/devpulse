import { ApiProperty } from '@nestjs/swagger';

export class TimeseriesDataPointDto {
  @ApiProperty({ description: 'Date in YYYY-MM-DD format' })
  public date!: string;

  @ApiProperty({ description: 'Active coding seconds for this day' })
  public activeSeconds!: number;

  @ApiProperty({ description: 'Money earned for this day' })
  public earnedMoney!: number;
}

export class GetAnalyticsTimeseriesResponseDto {
  @ApiProperty({ type: [TimeseriesDataPointDto] })
  public series!: Array<TimeseriesDataPointDto>;
}

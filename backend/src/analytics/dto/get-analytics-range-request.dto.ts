import { IsDateString, IsOptional } from 'class-validator';

export class GetAnalyticsRangeRequestDto {
  @IsOptional()
  @IsDateString()
  public from?: string;

  @IsOptional()
  @IsDateString()
  public to?: string;
}

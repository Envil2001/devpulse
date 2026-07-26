import { ApiProperty } from '@nestjs/swagger';

export class IngestTelemetryBatchResponseDto {
  @ApiProperty()
  public success!: boolean;

  @ApiProperty()
  public processedCount!: number;

  @ApiProperty()
  public message!: string;
}

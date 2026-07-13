import { ApiProperty } from '@nestjs/swagger';

export class IngestTelemetryBatchResponseDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty()
  processedCount!: number;

  @ApiProperty()
  message!: string;
}

import { ApiProperty } from '@nestjs/swagger';

export class BranchDataPointDto {
  @ApiProperty()
  public branchName!: string;

  @ApiProperty()
  public activeSeconds!: number;
}

export class GetAnalyticsBranchesResponseDto {
  @ApiProperty({ type: [BranchDataPointDto] })
  public branches!: Array<BranchDataPointDto>;
}

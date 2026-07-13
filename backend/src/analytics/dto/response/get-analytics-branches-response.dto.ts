import { ApiProperty } from '@nestjs/swagger';

export class BranchDataPointDto {
  @ApiProperty()
  branchName!: string;

  @ApiProperty()
  activeSeconds!: number;
}

export class GetAnalyticsBranchesResponseDto {
  @ApiProperty({ type: [BranchDataPointDto] })
  branches!: BranchDataPointDto[];
}

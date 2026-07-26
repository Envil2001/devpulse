import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyResponseDto {
  @ApiProperty()
  public id!: string;

  @ApiProperty()
  public name!: string;

  @ApiProperty()
  public keyPrefix!: string;

  @ApiProperty()
  public lastUsedAt!: Date | null;

  @ApiProperty()
  public createdAt!: Date;
}

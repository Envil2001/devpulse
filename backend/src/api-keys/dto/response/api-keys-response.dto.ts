import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiKeyResponseDto {
  @ApiProperty({ description: 'Unique ID of the API key' })
  public id!: string;

  @ApiProperty({ description: 'User-defined name for the API key' })
  public name!: string;

  @ApiProperty({ description: 'Prefix of the API key for display (e.g., dp_live_1234)' })
  public keyPrefix!: string;

  @ApiPropertyOptional({ description: 'Date of the last use', type: String })
  public lastUsedAt!: Date | null;

  @ApiProperty({ description: 'Date of the key creation' })
  public createdAt!: Date;
}

export class CreateApiKeyResponseDto {
  @ApiProperty({ description: 'Full raw key. Displayed only once upon creation.' })
  public rawKey!: string;

  @ApiProperty({ description: 'Metadata of the created key', type: ApiKeyResponseDto })
  public key!: ApiKeyResponseDto;
}

export class DemoKeyResponseDto {
  @ApiProperty({ description: 'Temporary raw key for demo mode' })
  public rawKey!: string;
}

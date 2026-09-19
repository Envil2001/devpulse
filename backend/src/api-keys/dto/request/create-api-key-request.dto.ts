import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { ApiKeyType } from '../../enums/api-key.enums';

export class CreateApiKeyRequestDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  declare public name: string;

  @IsEnum(ApiKeyType, { message: 'Type must be either "extension" or "integration"' })
  declare public type: ApiKeyType;

  @IsOptional()
  @IsString({ message: 'Device label must be a string' })
  @MaxLength(100, { message: 'Device label must not exceed 100 characters' })
  public deviceLabel?: string;
}

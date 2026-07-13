import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateApiKeyRequestDto {
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  public name?: string;

  @IsOptional()
  @IsString({ message: 'Device label must be a string' })
  @MaxLength(100, { message: 'Device label must not exceed 100 characters' })
  public deviceLabel?: string;
}

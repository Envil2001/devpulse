import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateUserRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  public displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  public timezone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  public hourlyRate?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  public currency?: string;
}

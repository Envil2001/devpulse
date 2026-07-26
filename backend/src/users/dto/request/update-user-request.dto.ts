import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  public displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  public timezone?: string;
}

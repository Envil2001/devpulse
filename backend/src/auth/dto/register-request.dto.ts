import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterRequestDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255)
  public email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(72, { message: 'Password must not exceed 72 characters' }) // bcrypt limit
  public password: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  public displayName?: string;
}

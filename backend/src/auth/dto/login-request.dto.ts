import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginRequestDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255)
  public email: string | undefined;

  @IsString()
  @IsNotEmpty()
  public password: string | undefined;
}

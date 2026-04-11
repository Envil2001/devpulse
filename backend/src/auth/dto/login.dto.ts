import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255)
  email: string | undefined;

  @IsString()
  @IsNotEmpty()
  password: string | undefined;
}

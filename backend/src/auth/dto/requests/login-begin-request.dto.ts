import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginBeginRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  clientPublicKey!: string;
}

import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginBeginRequestDto {
  @IsEmail()
  public email!: string;

  @IsString()
  @IsNotEmpty()
  public clientPublicKey!: string;
}

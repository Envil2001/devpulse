import { IsNotEmpty, IsString } from 'class-validator';

export class CompleteSignupRequestDto {
  @IsString()
  @IsNotEmpty()
  salt!: string;

  @IsString()
  @IsNotEmpty()
  verifier!: string;

  @IsString()
  @IsNotEmpty()
  publicKey!: string;

  @IsString()
  @IsNotEmpty()
  encryptedPrivateKey!: string;

  @IsString()
  @IsNotEmpty()
  iv!: string;

  @IsString()
  @IsNotEmpty()
  tag!: string;

  @IsString()
  @IsNotEmpty()
  protectedKey!: string;

  @IsString()
  @IsNotEmpty()
  protectedKeyIV!: string;

  @IsString()
  @IsNotEmpty()
  protectedKeyTag!: string;
}

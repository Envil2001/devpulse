import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CompleteSignupRequestDto {
  @IsString()
  @IsNotEmpty()
  public salt!: string;

  @IsString()
  @IsNotEmpty()
  public verifier!: string;

  @IsString()
  @IsNotEmpty()
  public publicKey!: string;

  @IsString()
  @IsNotEmpty()
  public encryptedPrivateKey!: string;

  @IsString()
  @IsNotEmpty()
  public iv!: string;

  @IsString()
  @IsNotEmpty()
  public tag!: string;

  @IsString()
  @IsNotEmpty()
  public protectedKey!: string;

  @IsString()
  @IsNotEmpty()
  public protectedKeyIV!: string;

  @IsString()
  @IsNotEmpty()
  public protectedKeyTag!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  public timezone?: string;
}

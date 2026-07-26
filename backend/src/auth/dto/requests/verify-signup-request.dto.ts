import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifySignUpRequestDto {
  @ApiProperty({
    description: "The verification code sent to the user's email.",
  })
  @IsNotEmpty()
  @IsEmail()
  public email!: string;

  @ApiProperty({
    description: "The verification code sent to the user's email.",
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'Verification code must be exactly 6 characters long' })
  public code!: string;
}

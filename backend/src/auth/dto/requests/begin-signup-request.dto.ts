import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  NotContains,
} from 'class-validator';

export class BeginSignupRequestDto {
  @ApiProperty({
    example: 'johndoe',
    description: 'Desired unique displayname',
    minLength: 3,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'displayName can only contain letters, numbers and underscores',
  })
  @NotContains(' ', { message: 'displayName cannot contain spaces' })
  public displayName!: string;

  @ApiProperty({
    description: 'The email address of the user.',
  })
  @IsNotEmpty()
  @IsEmail()
  public email!: string;
}

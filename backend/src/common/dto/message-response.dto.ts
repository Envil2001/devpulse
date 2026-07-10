import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class MessageResponseDto {
  @ApiProperty({
    description: 'Human-readable response message',
  })
  @IsString()
  message!: string;
}

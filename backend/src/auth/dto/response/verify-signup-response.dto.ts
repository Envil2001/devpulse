import { ApiProperty } from '@nestjs/swagger';

import { MessageResponseDto } from '../../../common/dto/message-response.dto';

export class VerifySignUpResponseDto extends MessageResponseDto {
  @ApiProperty({
    description: 'Temporary token required for the final signup step (JSRP setup)',
  })
  public signupToken!: string;
}

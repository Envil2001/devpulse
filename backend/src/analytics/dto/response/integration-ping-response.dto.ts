import { ApiProperty } from '@nestjs/swagger';

import { type TypeId } from '@devpulse/lib';

export class IntegrationPingResponseDto {
  @ApiProperty({ example: true })
  public success!: true;

  @ApiProperty({ example: 'Integration access granted' })
  public message!: string;

  @ApiProperty({ example: 'u_abc123def456' })
  public userId!: TypeId<'users'>;
}

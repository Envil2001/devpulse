import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { MessageResponseDto, type TypeId } from '@devpulse/lib';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../users/entities/user.entity';
import { CreateApiKeyRequestDto } from '../dto/request/create-api-key-request.dto';
import { ApiKey } from '../entities/api-key.entity';
import { ApiKeysService } from '../services/api-keys.service';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  public async createKey(
    @CurrentUser() user: User,
    @Body() dto: CreateApiKeyRequestDto,
  ): Promise<{ rawKey: string; keyEntity: ApiKey }> {
    const { rawKey, keyEntity } = await this.apiKeysService.createKey(user, dto.name);
    return {
      rawKey,
      keyEntity,
    };
  }

  @Get()
  public async getMyKeys(@CurrentUser() user: User): Promise<Array<ApiKey>> {
    return this.apiKeysService.getUserKeys(user.id);
  }

  @Delete(':id')
  public async revokeKey(
    @Param('id') id: TypeId<'apiKeys'>,
    @CurrentUser() user: User,
  ): Promise<MessageResponseDto> {
    await this.apiKeysService.revokeKey(id, user.id);
    return { message: 'Key revoked successfully' };
  }

  @Get('demo-key')
  public async getDemoKey(@CurrentUser() user: User): Promise<{ apiKey: string }> {
    const { rawKey } = await this.apiKeysService.createKey(user, 'Demo Key');
    return { apiKey: rawKey };
  }
}

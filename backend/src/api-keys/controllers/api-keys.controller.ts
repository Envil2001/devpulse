import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { type TypeId } from '@devpulse/lib';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { type AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';
import { ApiKeysService } from '../services/api-keys.service';
import { User } from '../../users/entities/user.entity';
import { CreateApiKeyRequestDto } from '../dto/request/create-api-key-request.dto';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  public async createKey(@CurrentUser() user: User, @Body() dto: CreateApiKeyRequestDto) {
    const { rawKey, keyEntity } = await this.apiKeysService.createKey(user, dto.name);
    return {
      apiKey: rawKey,
      data: keyEntity,
    };
  }

  @Get()
  public async getMyKeys(@CurrentUser() user: User) {
    return this.apiKeysService.getUserKeys(user.id);
  }

  @Delete(':id')
  public async revokeKey(@Param('id') id: TypeId<'apiKeys'>, @CurrentUser() user: User) {
    await this.apiKeysService.revokeKey(id, user.id);
    return { message: 'Key revoked successfully' };
  }

  @Get('demo-key')
  public async getDemoKey(@CurrentUser() user: User) {
    const { rawKey } = await this.apiKeysService.createKey(user, 'Demo Key');
    return { apiKey: rawKey };
  }
}

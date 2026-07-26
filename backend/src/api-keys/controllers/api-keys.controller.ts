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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { type TypeId } from '@devpulse/lib';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { MessageResponseDto } from '../../common/dto/message-response.dto';
import { User } from '../../users/entities/user.entity';
import { CreateApiKeyRequestDto } from '../dto/request/create-api-key-request.dto';
import {
  ApiKeyResponseDto,
  CreateApiKeyResponseDto,
  DemoKeyResponseDto,
} from '../dto/response/api-keys-response.dto';
import { ApiKey } from '../entities/api-key.entity';
import { ApiKeysService } from '../services/api-keys.service';

@ApiTags('API Keys')
@ApiBearerAuth()
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new API key' })
  @ApiResponse({ status: HttpStatus.CREATED, type: CreateApiKeyResponseDto })
  public async createKey(
    @CurrentUser() user: User,
    @Body() dto: CreateApiKeyRequestDto,
  ): Promise<CreateApiKeyResponseDto> {
    const { rawKey, keyEntity } = await this.apiKeysService.createKey(user, dto.name);

    return {
      rawKey,
      key: this.mapToDto(keyEntity),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get my API keys' })
  @ApiResponse({ status: HttpStatus.OK, type: [ApiKeyResponseDto] })
  public async getMyKeys(@CurrentUser() user: User): Promise<Array<ApiKeyResponseDto>> {
    const keys = await this.apiKeysService.getUserKeys(user.id);

    return keys.map((key) => this.mapToDto(key));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({ status: HttpStatus.OK, type: MessageResponseDto })
  public async revokeKey(
    @Param('id') id: TypeId<'apiKeys'>,
    @CurrentUser() user: User,
  ): Promise<MessageResponseDto> {
    await this.apiKeysService.revokeKey(id, user.id);
    return { message: 'Key revoked successfully' };
  }

  @Get('demo-key')
  @ApiOperation({ summary: 'Get a temporary key for demo mode' })
  @ApiResponse({ status: HttpStatus.OK, type: DemoKeyResponseDto })
  public async getDemoKey(@CurrentUser() user: User): Promise<DemoKeyResponseDto> {
    const { rawKey } = await this.apiKeysService.createKey(user, 'Demo Key');
    return { rawKey };
  }

  private mapToDto(entity: ApiKey): ApiKeyResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      keyPrefix: entity.keyPrefix,
      lastUsedAt: entity.lastUsedAt,
      createdAt: entity.createdAt,
    };
  }
}

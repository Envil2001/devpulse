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

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { type AuthenticatedUser } from '../auth/interfaces/jwt-payload.interface';

import { type CreateApiKeyDto } from './dto/create-api-key.dto';
import { type UpdateApiKeyDto } from './dto/update-api-key.dto';
import { type ApiKeyListItem, ApiKeysService, type CreatedApiKey } from './api-keys.service';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  public async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateApiKeyDto,
  ): Promise<CreatedApiKey> {
    return this.apiKeysService.create(user.id as TypeId<'users'>, dto);
  }

  @Get()
  public async findAll(@CurrentUser() user: AuthenticatedUser): Promise<Array<ApiKeyListItem>> {
    return this.apiKeysService.findAllByUser(user.id as TypeId<'users'>);
  }

  @Get(':id')
  public async findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApiKeyListItem> {
    return this.apiKeysService.findOneByUser(user.id as TypeId<'users'>, id as TypeId<'apiKeys'>);
  }

  @Patch(':id')
  public async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateApiKeyDto,
  ): Promise<ApiKeyListItem> {
    return this.apiKeysService.update(user.id as TypeId<'users'>, id as TypeId<'apiKeys'>, dto);
  }

  @Delete(':id')
  public async revoke(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ApiKeyListItem> {
    return this.apiKeysService.revoke(user.id as TypeId<'users'>, id as TypeId<'apiKeys'>);
  }
}

import { createHash, randomBytes } from 'node:crypto';

import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { type TypeId } from '@devpulse/lib';

import { type CreateApiKeyDto } from './dto/create-api-key.dto';
import { type UpdateApiKeyDto } from './dto/update-api-key.dto';
import { ApiKey } from './entities/api-key.entity';

export interface ApiKeyListItem {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: Date | null;
  deviceLabel: string | null;
  createdAt: Date;
}

export interface CreatedApiKey extends ApiKeyListItem {
  key: string;
}

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeysRepository: Repository<ApiKey>,
  ) {}

  public async create(userId: TypeId<'users'>, dto: CreateApiKeyDto): Promise<CreatedApiKey> {
    const key = this.generateApiKey();
    const keyHash = this.hashApiKey(key);
    const keyPrefix = key.slice(0, 12);

    const entity = this.apiKeysRepository.create({
      userId,
      name: dto.name,
      deviceLabel: dto.deviceLabel ?? null,
      keyHash,
      keyPrefix,
      isActive: true,
    });

    try {
      const saved = await this.apiKeysRepository.save(entity);
      return {
        id: saved.id,
        name: saved.name,
        keyPrefix: saved.keyPrefix,
        isActive: saved.isActive,
        lastUsedAt: saved.lastUsedAt,
        deviceLabel: saved.deviceLabel,
        createdAt: saved.createdAt,
        key,
      };
    } catch {
      throw new InternalServerErrorException('Failed to create API key');
    }
  }

  public async findAllByUser(userId: TypeId<'users'>): Promise<Array<ApiKeyListItem>> {
    const items = await this.apiKeysRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    return items.map((item) => this.toListItem(item));
  }

  public async findOneByUser(
    userId: TypeId<'users'>,
    id: TypeId<'apiKeys'>,
  ): Promise<ApiKeyListItem> {
    const item = await this.findOwnedOrFail(userId, id);
    return this.toListItem(item);
  }

  public async update(
    userId: TypeId<'users'>,
    id: TypeId<'apiKeys'>,
    dto: UpdateApiKeyDto,
  ): Promise<ApiKeyListItem> {
    const item = await this.findOwnedOrFail(userId, id);

    if (dto.name !== undefined) {
      item.name = dto.name;
    }

    if (dto.deviceLabel !== undefined) {
      item.deviceLabel = dto.deviceLabel;
    }

    try {
      const saved = await this.apiKeysRepository.save(item);
      return this.toListItem(saved);
    } catch {
      throw new InternalServerErrorException('Failed to update API key');
    }
  }

  public async revoke(userId: TypeId<'users'>, id: TypeId<'apiKeys'>): Promise<ApiKeyListItem> {
    const item = await this.findOwnedOrFail(userId, id);

    if (!item.isActive) {
      return this.toListItem(item);
    }

    item.isActive = false;

    try {
      const saved = await this.apiKeysRepository.save(item);
      return this.toListItem(saved);
    } catch {
      throw new InternalServerErrorException('Failed to revoke API key');
    }
  }

  private async findOwnedOrFail(userId: TypeId<'users'>, id: TypeId<'apiKeys'>): Promise<ApiKey> {
    const item = await this.apiKeysRepository.findOne({ where: { id, userId } });

    if (!item) {
      throw new NotFoundException('API key not found');
    }

    return item;
  }

  private toListItem(item: ApiKey): ApiKeyListItem {
    return {
      id: item.id,
      name: item.name,
      keyPrefix: item.keyPrefix,
      isActive: item.isActive,
      lastUsedAt: item.lastUsedAt,
      deviceLabel: item.deviceLabel,
      createdAt: item.createdAt,
    };
  }

  private generateApiKey(): string {
    return `dvp_${randomBytes(32).toString('hex')}`;
  }

  private hashApiKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }
}

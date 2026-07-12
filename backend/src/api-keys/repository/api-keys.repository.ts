import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { type TypeId } from '@devpulse/lib';
import { ApiKey } from '../entities/api-key.entity';

@Injectable()
export class ApiKeysRepository {
  constructor(
    @InjectRepository(ApiKey)
    private readonly repository: Repository<ApiKey>,
  ) {}

  public async save(apiKey: ApiKey): Promise<ApiKey> {
    return this.repository.save(apiKey);
  }

  public create(entityLike: Partial<ApiKey>): ApiKey {
    return this.repository.create(entityLike);
  }

  public async findByUserId(userId: TypeId<'users'>): Promise<ApiKey[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  public async findByHashWithUser(keyHash: string): Promise<ApiKey | null> {
    return this.repository.findOne({
      where: { keyHash },
      relations: ['user'],
    });
  }

  public async updateLastUsedAt(id: TypeId<'apiKeys'>): Promise<void> {
    await this.repository.update(id, { lastUsedAt: new Date() });
  }

  public async deleteByIdAndUser(id: TypeId<'apiKeys'>, userId: TypeId<'users'>): Promise<void> {
    await this.repository.delete({ id, userId });
  }
}

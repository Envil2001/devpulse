import * as crypto from 'node:crypto';

import { Injectable, Logger } from '@nestjs/common';

import { TypeId, typeIdGenerator } from '@devpulse/lib';

import { User } from '../../users/entities/user.entity';
import { ApiKey } from '../entities/api-key.entity';
import { ApiKeysRepository } from '../repository/api-keys.repository';

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(private readonly apiKeysRepository: ApiKeysRepository) {}

  public async createKey(user: User, name: string): Promise<{ rawKey: string; keyEntity: ApiKey }> {
    const randomBytes = crypto.randomBytes(32).toString('hex');
    const rawKey = `dp_live_${randomBytes}`;

    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 12);

    const newKey = this.apiKeysRepository.create({
      id: typeIdGenerator('apiKeys'),
      name,
      keyHash,
      keyPrefix,
      user,
    });

    const savedKey = await this.apiKeysRepository.save(newKey);
    this.logger.log(`Created API Key "${name}" for user ${user.id}`);

    return { rawKey, keyEntity: savedKey };
  }

  public async getUserKeys(userId: TypeId<'users'>): Promise<Array<ApiKey>> {
    return this.apiKeysRepository.findByUserId(userId);
  }

  public async revokeKey(keyId: TypeId<'apiKeys'>, userId: TypeId<'users'>): Promise<void> {
    await this.apiKeysRepository.deleteByIdAndUser(keyId, userId);
    this.logger.log(`Revoked API Key ${keyId} for user ${userId}`);
  }

  public async validateApiKey(rawKey: string): Promise<User | null> {
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKey = await this.apiKeysRepository.findByHashWithUser(hash);

    if (!apiKey) {
      return null;
    }

    this.apiKeysRepository.updateLastUsedAt(apiKey.id).catch((error: unknown) => {
      this.logger.error(`Failed to update lastUsedAt for key ${apiKey.id}`, String(error));
    });

    return apiKey.user;
  }
}

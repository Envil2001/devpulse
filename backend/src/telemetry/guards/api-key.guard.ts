import { createHash } from 'node:crypto';

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Request } from 'express';
import { Repository } from 'typeorm';

import { ApiKey } from '../../api-keys/entities/api-key.entity';

export interface ApiKeyPrincipal {
  apiKeyId: string;
  userId: string;
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function extractBearerToken(headerValue: unknown): string | null {
  if (typeof headerValue !== 'string' || headerValue.trim().length === 0) {
    return null;
  }
  const trimmed = headerValue.trim();
  if (!trimmed.toLowerCase().startsWith('bearer ')) {
    return null;
  }
  const token = trimmed.slice('bearer '.length).trim();
  return token.length > 0 ? token : null;
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeysRepository: Repository<ApiKey>,
  ) {}

  public async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest<Request>();
    const token = extractBearerToken(request.headers.authorization);
    if (token === null) {
      throw new UnauthorizedException('Missing API key');
    }

    const keyHash = sha256Hex(token);
    const apiKey = await this.apiKeysRepository.findOne({ where: { keyHash } });
    if (!apiKey?.isActive) {
      throw new UnauthorizedException('Invalid API key');
    }

    apiKey.lastUsedAt = new Date();
    await this.apiKeysRepository.save(apiKey);

    (request as unknown as { apiKeyPrincipal?: ApiKeyPrincipal }).apiKeyPrincipal = {
      apiKeyId: apiKey.id,
      userId: apiKey.userId,
    };
    return true;
  }
}

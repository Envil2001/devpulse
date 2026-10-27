import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import {
  type ExecutionContext,
  type INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { type TypeId } from '@devpulse/lib';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { type MessageResponseDto } from '../../common/dto/message-response.dto';
import { getHttpServer } from '../../test/get-http-server';
import { User } from '../../users/entities/user.entity';
import { type CreateApiKeyRequestDto } from '../dto/request/create-api-key-request.dto';
import {
  type ApiKeyResponseDto,
  type CreateApiKeyResponseDto,
} from '../dto/response/api-keys-response.dto';
import { ApiKey } from '../entities/api-key.entity';
import { ApiKeyScope, ApiKeyType } from '../enums/api-key.enums';
import { ApiKeysService } from '../services/api-keys.service';

import { ApiKeysController } from './api-keys.controller';

describe('ApiKeysController (Integration)', () => {
  let app: INestApplication;

  const mockUser = Object.assign(new User(), {
    id: 'u_user123',
    email: 'dev@devpulse.io',
  });

  const mockApiKeyEntity = Object.assign(new ApiKey(), {
    id: 'ak_test123',
    name: 'VS Code Mac',
    deviceLabel: 'MacBook Pro',
    keyPrefix: 'dp_1234',
    scopes: [ApiKeyScope.TELEMETRY_WRITE],
    lastUsedAt: new Date('2026-03-30T10:00:00.000Z'),
    createdAt: new Date('2026-03-30T09:00:00.000Z'),
  });

  const mockApiKeysService = {
    createKey: jest.fn(
      (_user: User, _name: string, _type: ApiKeyType, _deviceLabel?: string | null) =>
        Promise.resolve({
          rawKey: 'dp_123456789qwerty',
          keyEntity: mockApiKeyEntity,
        }),
    ),
    getUserKeys: jest.fn((_userId: TypeId<'users'>) => Promise.resolve([mockApiKeyEntity])),
    revokeKey: jest.fn((_id: TypeId<'apiKeys'>, _userId: TypeId<'users'>) => Promise.resolve()),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ApiKeysController],
      providers: [
        {
          provide: ApiKeysService,
          useValue: mockApiKeysService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest<{
            headers: { authorization?: string };
            user?: User;
          }>();

          if (req.headers.authorization === 'Bearer valid-jwt') {
            req.user = mockUser;
            return true;
          }
          throw new UnauthorizedException();
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return 401 if request is unauthenticated', async () => {
    const response = await request(getHttpServer(app)).get('/api-keys');
    expect(response.status).toBe(401);
  });

  it('should create a new API key and return raw key alongside details', async () => {
    const payload: CreateApiKeyRequestDto = {
      name: 'VS Code Mac',
      type: ApiKeyType.EXTENSION,
      deviceLabel: 'MacBook Pro',
    };

    const response = await request(getHttpServer(app))
      .post('/api-keys')
      .set('Authorization', 'Bearer valid-jwt')
      .send(payload);

    const body = response.body as CreateApiKeyResponseDto;

    expect(response.status).toBe(201);
    expect(body.rawKey).toBe('dp_123456789qwerty');
    expect(body.key.id).toBe('ak_test123');
    expect(body.key.type).toBe(ApiKeyType.EXTENSION);
    expect(mockApiKeysService.createKey).toHaveBeenCalledWith(
      mockUser,
      'VS Code Mac',
      ApiKeyType.EXTENSION,
      'MacBook Pro',
    );
  });

  it('should return user API keys', async () => {
    const response = await request(getHttpServer(app))
      .get('/api-keys')
      .set('Authorization', 'Bearer valid-jwt');

    const body = response.body as Array<ApiKeyResponseDto>;

    expect(response.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
    expect(body[0]?.id).toBe('ak_test123');
  });

  it('should revoke an API key and return success message', async () => {
    const response = await request(getHttpServer(app))
      .delete('/api-keys/ak_test123')
      .set('Authorization', 'Bearer valid-jwt');

    const body = response.body as MessageResponseDto;

    expect(response.status).toBe(200);
    expect(body.message).toBe('Key revoked successfully');
    expect(mockApiKeysService.revokeKey).toHaveBeenCalledWith('ak_test123', 'u_user123');
  });
});
